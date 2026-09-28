import time
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.sale import Sale, SaleItem, SaleReturn, SaleReturnItem
from app.models.stock import WarehouseStock, StockMovement
from app.models.product import Product, ProductVariant
from app.models.partner import Customer
from app.models.finance import Payment
from app.models.user import User
from app.schemas.sale import (
    SaleCreate, SaleResponse, SaleReturnCreate, SaleReturnResponse
)

router = APIRouter(prefix="/sales", tags=["Sales & POS Checkout"])

def generate_invoice_number():
    return f"INV-{int(time.time()) % 1000000:06d}{random.randint(10, 99)}"

def generate_sale_return_number():
    return f"SRET-{int(time.time()) % 1000000:06d}{random.randint(10, 99)}"

def format_sale_response(s: Sale) -> SaleResponse:
    items = []
    for i in s.items:
        var_label = None
        if i.variant:
            parts = [x for x in [i.variant.size, i.variant.color] if x]
            var_label = "/".join(parts) if parts else i.variant.sku

        items.append({
            "id": i.id,
            "product_id": i.product_id,
            "product_name": i.product.name,
            "product_khmer_name": i.product.khmer_name,
            "sku": i.variant.sku if i.variant else i.product.sku,
            "variant_id": i.variant_id,
            "variant_label": var_label,
            "quantity": i.quantity,
            "unit_price": i.unit_price,
            "cost_price": i.cost_price,
            "discount": i.discount,
            "subtotal": i.subtotal,
            "profit": i.profit
        })

    return SaleResponse(
        id=s.id,
        invoice_number=s.invoice_number,
        customer_id=s.customer_id,
        customer_name=s.customer.name if s.customer else "Walk-in Customer",
        customer_phone=s.customer.phone if s.customer else None,
        warehouse_id=s.warehouse_id,
        warehouse_name=s.warehouse.name,
        sale_date=s.sale_date,
        subtotal=s.subtotal,
        discount_amount=s.discount_amount,
        tax_amount=s.tax_amount,
        total_amount=s.total_amount,
        paid_amount=s.paid_amount,
        due_amount=round(max(0.0, s.total_amount - s.paid_amount), 2),
        payment_method=s.payment_method,
        payment_status=s.payment_status,
        status=s.status,
        khqr_reference=s.khqr_reference,
        notes=s.notes,
        salesperson_name=s.salesperson.full_name,
        created_at=s.created_at,
        items=items
    )

@router.get("", response_model=List[SaleResponse])
def get_sales(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    customer_id: Optional[int] = None,
    payment_status: Optional[str] = None
):
    query = db.query(Sale)
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if payment_status:
        query = query.filter(Sale.payment_status == payment_status)

    sales = query.order_by(desc(Sale.id)).all()
    return [format_sale_response(s) for s in sales]

@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    s = db.query(Sale).filter(Sale.id == sale_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sale invoice not found")
    return format_sale_response(s)

@router.post("", response_model=SaleResponse)
def create_sale(
    data: SaleCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Sale must contain at least one item")

    # Verify customer if provided
    customer = None
    if data.customer_id:
        customer = db.query(Customer).filter(Customer.id == data.customer_id, Customer.is_deleted == False).first()
        if not customer:
            raise HTTPException(status_code=400, detail="Invalid Customer ID")

    # Step 1: Pre-validate stock availability for all items in the warehouse
    for item in data.items:
        stock = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == data.warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id
        ).with_for_update().first()

        avail = stock.current_stock if stock else 0
        if avail < item.quantity:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            p_name = prod.name if prod else "Product"
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient inventory for '{p_name}'. Available: {avail}, Requested: {item.quantity}"
            )

    # Step 2: Calculate line items and totals
    subtotal = 0.0
    for item in data.items:
        subtotal += (item.quantity * item.unit_price) - item.discount

    total = subtotal - data.discount_amount + data.tax_amount

    pay_status = "Unpaid"
    if data.paid_amount >= total:
        pay_status = "Paid"
    elif data.paid_amount > 0:
        pay_status = "Partially Paid"

    # Step 3: Insert Sale record
    sale = Sale(
        invoice_number=generate_invoice_number(),
        customer_id=data.customer_id,
        warehouse_id=data.warehouse_id,
        subtotal=round(subtotal, 2),
        discount_amount=round(data.discount_amount, 2),
        tax_amount=round(data.tax_amount, 2),
        total_amount=round(total, 2),
        paid_amount=round(data.paid_amount, 2),
        payment_method=data.payment_method,
        payment_status=pay_status,
        status="Completed",
        khqr_reference=data.khqr_reference,
        notes=data.notes,
        salesperson_id=current_user.id
    )
    db.add(sale)
    db.flush()

    # Step 4: Process items, stock reductions, COGS and profit snapshots
    for item in data.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        var = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first() if item.variant_id else None

        unit_cost = (var.cost_price if var and var.cost_price is not None else prod.cost_price) or 0.0
        line_sub = (item.quantity * item.unit_price) - item.discount
        line_cost_total = item.quantity * unit_cost
        line_profit = line_sub - line_cost_total

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            cost_price=unit_cost,
            discount=item.discount,
            subtotal=round(line_sub, 2),
            profit=round(line_profit, 2)
        )
        db.add(sale_item)

        # Stock decrement
        stock = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == data.warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id
        ).with_for_update().first()

        before_qty = stock.current_stock
        stock.current_stock -= item.quantity
        after_qty = stock.current_stock

        movement = StockMovement(
            product_id=item.product_id,
            variant_id=item.variant_id,
            warehouse_id=data.warehouse_id,
            movement_type="Sale",
            quantity=-item.quantity,
            before_quantity=before_qty,
            after_quantity=after_qty,
            reference_number=sale.invoice_number,
            user_id=current_user.id,
            note=f"Sale to {customer.name if customer else 'Walk-in Customer'} (Method: {data.payment_method})"
        )
        db.add(movement)

    # Step 5: Payment ledger entry
    if data.paid_amount > 0:
        payment = Payment(
            transaction_type="Sale",
            reference_id=sale.id,
            reference_number=sale.invoice_number,
            amount=data.paid_amount,
            payment_method=data.payment_method,
            notes=f"Payment for invoice {sale.invoice_number} via {data.payment_method}",
            recorded_by_id=current_user.id
        )
        db.add(payment)

    # If partial/unpaid and customer exists, add to credit
    due = total - data.paid_amount
    if due > 0 and customer:
        customer.current_credit += due

    db.commit()
    db.refresh(sale)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Sale",
        entity_id=str(sale.id),
        description=f"Completed sale {sale.invoice_number} for ${total:.2f} via {sale.payment_method}.",
        request=request
    )

    return format_sale_response(sale)

# --- SALES RETURNS ---
@router.post("/returns", response_model=SaleReturnResponse)
def create_sale_return(
    data: SaleReturnCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager", "staff"]))
):
    sale = db.query(Sale).filter(Sale.id == data.sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale invoice not found")

    if not data.items:
        raise HTTPException(status_code=400, detail="Return must have at least one item")

    total_refund = 0.0
    for it in data.items:
        total_refund += it.quantity * it.unit_price

    s_return = SaleReturn(
        return_number=generate_sale_return_number(),
        sale_id=sale.id,
        customer_id=sale.customer_id,
        warehouse_id=sale.warehouse_id,
        refund_amount=round(total_refund, 2),
        payment_method=data.payment_method,
        reason=data.reason,
        status="Completed",
        created_by_id=current_user.id
    )
    db.add(s_return)
    db.flush()

    for it in data.items:
        r_item = SaleReturnItem(
            return_id=s_return.id,
            product_id=it.product_id,
            variant_id=it.variant_id,
            quantity=it.quantity,
            unit_price=it.unit_price,
            subtotal=round(it.quantity * it.unit_price, 2)
        )
        db.add(r_item)

        # Restore inventory
        stock = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == sale.warehouse_id,
            WarehouseStock.product_id == it.product_id,
            WarehouseStock.variant_id == it.variant_id
        ).with_for_update().first()

        before_qty = stock.current_stock if stock else 0
        if not stock:
            stock = WarehouseStock(
                warehouse_id=sale.warehouse_id,
                product_id=it.product_id,
                variant_id=it.variant_id,
                current_stock=0
            )
            db.add(stock)

        stock.current_stock += it.quantity
        after_qty = stock.current_stock

        movement = StockMovement(
            product_id=it.product_id,
            variant_id=it.variant_id,
            warehouse_id=sale.warehouse_id,
            movement_type="Sale Return",
            quantity=it.quantity,
            before_quantity=before_qty,
            after_quantity=after_qty,
            reference_number=s_return.return_number,
            user_id=current_user.id,
            note=f"Return for {sale.invoice_number}: {data.reason}"
        )
        db.add(movement)

    # If refund was paid out, log payment ledger entry
    pay = Payment(
        transaction_type="Expense",
        reference_id=s_return.id,
        reference_number=s_return.return_number,
        amount=total_refund,
        payment_method=data.payment_method,
        notes=f"Customer refund for invoice {sale.invoice_number}",
        recorded_by_id=current_user.id
    )
    db.add(pay)

    db.commit()
    db.refresh(s_return)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="RETURN",
        entity="SaleReturn",
        entity_id=str(s_return.id),
        description=f"Processed sales return {s_return.return_number} for ${total_refund:.2f}.",
        request=request
    )

    return SaleReturnResponse(
        id=s_return.id,
        return_number=s_return.return_number,
        sale_id=sale.id,
        invoice_number=sale.invoice_number,
        customer_name=sale.customer.name if sale.customer else "Walk-in Customer",
        warehouse_name=sale.warehouse.name,
        return_date=s_return.return_date,
        refund_amount=s_return.refund_amount,
        payment_method=s_return.payment_method,
        reason=s_return.reason,
        status=s_return.status,
        created_by_name=current_user.full_name,
        created_at=s_return.created_at
    )
