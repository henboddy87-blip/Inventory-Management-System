from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.finance import ExpenseCategory, Expense, Payment
from app.models.sale import Sale
from app.models.purchase import Purchase
from app.models.user import User
from app.schemas.finance import (
    ExpenseCategoryResponse, ExpenseCategoryCreate,
    ExpenseCreate, ExpenseResponse,
    PaymentCreate, PaymentResponse
)

router = APIRouter(prefix="/finance", tags=["Finance & Expenses"])

# --- EXPENSE CATEGORIES ---
@router.get("/categories", response_model=List[ExpenseCategoryResponse])
def get_expense_categories(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(ExpenseCategory).all()

@router.post("/categories", response_model=ExpenseCategoryResponse)
def create_expense_category(
    data: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "accountant"]))
):
    if db.query(ExpenseCategory).filter(ExpenseCategory.name == data.name).first():
        raise HTTPException(status_code=400, detail="Expense category already exists")
    cat = ExpenseCategory(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

# --- EXPENSES ---
@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    category_id: Optional[int] = None
):
    query = db.query(Expense)
    if category_id:
        query = query.filter(Expense.category_id == category_id)

    expenses = query.order_by(desc(Expense.expense_date)).all()
    results = []
    for exp in expenses:
        results.append(
            ExpenseResponse(
                id=exp.id,
                category_id=exp.category_id,
                category_name=exp.category.name,
                category_khmer_name=exp.category.khmer_name,
                amount=exp.amount,
                description=exp.description,
                payment_method=exp.payment_method,
                expense_date=exp.expense_date,
                receipt_url=exp.receipt_url,
                user_name=exp.user.full_name,
                created_at=exp.created_at
            )
        )
    return results

@router.post("/expenses", response_model=ExpenseResponse)
def create_expense(
    data: ExpenseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager", "accountant"]))
):
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid expense category")

    expense = Expense(
        category_id=data.category_id,
        amount=round(data.amount, 2),
        description=data.description,
        payment_method=data.payment_method,
        expense_date=data.expense_date or None,
        receipt_url=data.receipt_url,
        user_id=current_user.id
    )
    db.add(expense)
    db.flush()

    # Create payment ledger entry
    payment = Payment(
        transaction_type="Expense",
        reference_id=expense.id,
        reference_number=f"EXP-{expense.id:04d}",
        amount=expense.amount,
        payment_method=expense.payment_method,
        notes=f"Expense: {expense.description}",
        recorded_by_id=current_user.id
    )
    db.add(payment)

    db.commit()
    db.refresh(expense)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Expense",
        entity_id=str(expense.id),
        description=f"Recorded expense of ${expense.amount:.2f} for {category.name}.",
        request=request
    )

    return ExpenseResponse(
        id=expense.id,
        category_id=category.id,
        category_name=category.name,
        category_khmer_name=category.khmer_name,
        amount=expense.amount,
        description=expense.description,
        payment_method=expense.payment_method,
        expense_date=expense.expense_date,
        receipt_url=expense.receipt_url,
        user_name=current_user.full_name,
        created_at=expense.created_at
    )

# --- PAYMENTS ---
@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    payments = db.query(Payment).order_by(desc(Payment.id)).limit(100).all()
    results = []
    for p in payments:
        results.append(
            PaymentResponse(
                id=p.id,
                transaction_type=p.transaction_type,
                reference_id=p.reference_id,
                reference_number=p.reference_number,
                payment_date=p.payment_date,
                amount=p.amount,
                payment_method=p.payment_method,
                notes=p.notes,
                recorded_by_name=p.recorded_by.full_name,
                created_at=p.created_at
            )
        )
    return results

@router.post("/payments", response_model=PaymentResponse)
def record_additional_payment(
    data: PaymentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager", "accountant"]))
):
    ref_num = ""
    if data.transaction_type == "Sale":
        sale = db.query(Sale).filter(Sale.id == data.reference_id).with_for_update().first()
        if not sale:
            raise HTTPException(status_code=404, detail="Sale invoice not found")
        ref_num = sale.invoice_number
        sale.paid_amount += data.amount
        if sale.paid_amount >= sale.total_amount:
            sale.payment_status = "Paid"
        else:
            sale.payment_status = "Partially Paid"

        # If customer had credit, reduce it
        if sale.customer:
            sale.customer.current_credit = max(0.0, sale.customer.current_credit - data.amount)

    elif data.transaction_type == "Purchase":
        po = db.query(Purchase).filter(Purchase.id == data.reference_id).with_for_update().first()
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        ref_num = po.po_number
        po.paid_amount += data.amount
        if po.paid_amount >= po.total_amount:
            po.payment_status = "Paid"
        else:
            po.payment_status = "Partially Paid"
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    payment = Payment(
        transaction_type=data.transaction_type,
        reference_id=data.reference_id,
        reference_number=ref_num,
        amount=round(data.amount, 2),
        payment_method=data.payment_method,
        notes=data.notes,
        recorded_by_id=current_user.id
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="PAYMENT",
        entity=data.transaction_type,
        entity_id=str(data.reference_id),
        description=f"Recorded additional payment of ${data.amount:.2f} for {ref_num}.",
        request=request
    )

    return PaymentResponse(
        id=payment.id,
        transaction_type=payment.transaction_type,
        reference_id=payment.reference_id,
        reference_number=payment.reference_number,
        payment_date=payment.payment_date,
        amount=payment.amount,
        payment_method=payment.payment_method,
        notes=payment.notes,
        recorded_by_name=current_user.full_name,
        created_at=payment.created_at
    )
