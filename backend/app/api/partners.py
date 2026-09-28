from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.partner import Supplier, Customer
from app.models.purchase import Purchase
from app.models.sale import Sale
from app.schemas.partner import (
    SupplierCreate, SupplierUpdate, SupplierResponse,
    CustomerCreate, CustomerUpdate, CustomerResponse
)

router = APIRouter(tags=["Suppliers & Customers"])

# --- SUPPLIERS ---
@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    search: Optional[str] = None
):
    query = db.query(Supplier).filter(Supplier.is_deleted == False)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Supplier.company_name.ilike(s),
                Supplier.khmer_company_name.ilike(s),
                Supplier.contact_person.ilike(s),
                Supplier.phone.ilike(s)
            )
        )
    suppliers = query.order_by(Supplier.id.desc()).all()
    results = []
    for sup in suppliers:
        stats = db.query(
            func.count(Purchase.id).label("cnt"),
            func.coalesce(func.sum(Purchase.total_amount), 0.0).label("tot")
        ).filter(Purchase.supplier_id == sup.id).first()

        item = SupplierResponse.model_validate(sup)
        item.total_purchases_count = stats.cnt or 0
        item.total_purchases_amount = float(stats.tot or 0.0)
        results.append(item)
    return results

@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier(
    data: SupplierCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Supplier",
        entity_id=str(supplier.id),
        description=f"Created supplier '{supplier.company_name}'.",
        request=request
    )
    return SupplierResponse.model_validate(supplier)

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.is_deleted == False).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(supplier, k, v)

    db.commit()
    db.refresh(supplier)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="UPDATE",
        entity="Supplier",
        entity_id=str(supplier.id),
        description=f"Updated supplier '{supplier.company_name}'.",
        request=request
    )
    return SupplierResponse.model_validate(supplier)

@router.delete("/suppliers/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin"]))
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.is_deleted == False).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    supplier.is_deleted = True
    db.commit()

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="DELETE",
        entity="Supplier",
        entity_id=str(supplier_id),
        description=f"Soft-deleted supplier '{supplier.company_name}'.",
        request=request
    )
    return {"message": "Supplier deleted successfully"}

# --- CUSTOMERS ---
@router.get("/customers", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    search: Optional[str] = None
):
    query = db.query(Customer).filter(Customer.is_deleted == False)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.name.ilike(s),
                Customer.khmer_name.ilike(s),
                Customer.phone.ilike(s)
            )
        )
    customers = query.order_by(Customer.id.desc()).all()
    results = []
    for c in customers:
        stats = db.query(
            func.count(Sale.id).label("cnt"),
            func.coalesce(func.sum(Sale.total_amount), 0.0).label("tot")
        ).filter(Sale.customer_id == c.id).first()

        item = CustomerResponse.model_validate(c)
        item.total_sales_count = stats.cnt or 0
        item.total_sales_amount = float(stats.tot or 0.0)
        results.append(item)
    return results

@router.post("/customers", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Customer",
        entity_id=str(customer.id),
        description=f"Created customer '{customer.name}'.",
        request=request
    )
    return CustomerResponse.model_validate(customer)

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_deleted == False).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(customer, k, v)

    db.commit()
    db.refresh(customer)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="UPDATE",
        entity="Customer",
        entity_id=str(customer.id),
        description=f"Updated customer '{customer.name}'.",
        request=request
    )
    return CustomerResponse.model_validate(customer)

@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin"]))
):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_deleted == False).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.is_deleted = True
    db.commit()

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="DELETE",
        entity="Customer",
        entity_id=str(customer_id),
        description=f"Soft-deleted customer '{customer.name}'.",
        request=request
    )
    return {"message": "Customer deleted successfully"}
