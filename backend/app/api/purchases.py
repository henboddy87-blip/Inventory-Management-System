import time
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.purchase import Purchase, PurchaseItem, PurchaseReturn, PurchaseReturnItem
from app.models.stock import WarehouseStock, StockMovement
from app.models.product import Product
from app.models.partner import Supplier
from app.models.finance import Payment
from app.models.user import User
from app.schemas.purchase import (
    PurchaseCreate, PurchaseResponse, PurchaseReceiveRequest,
    PurchaseReturnCreate, PurchaseReturnResponse
)

router = APIRouter(prefix="/purchases", tags=["Purchasing & Goods Receiving"])

def generate_po_number():
    return f"PO-{int(time.time()) % 1000000:06d}{random.randint(10, 99)}"

def generate_return_number():
    return f"PRET-{int(time.time()) % 1000000:06d}{random.randint(10, 99)}"

def format_purchase_response(p: Purchase) -> PurchaseResponse:
    items = []
    for i in p.items:
        var_label = None
        if i.variant:
            parts = [x for x in [i.variant.size, i.variant.color] if x]
            var_label = "/".join(parts) if parts else i.variant.sku

        items.append({
            "id": i.id,
            "product_id": i.product_id,
            "product_name": i.product.name,
            "sku": i.variant.sku if i.variant else i.product.sku,
            "variant_id": i.variant_id,
            "variant_label": var_label,
            "quantity": i.quantity,
            "received_quantity": i.received_quantity,
            "unit_cost": i.unit_cost,
            "discount": i.discount,
            "subtotal": i.subtotal
        })

    return PurchaseResponse(
        id=p.id,
        po_number=p.po_number,
        supplier_id=p.supplier_id,
        supplier_name=p.supplier.company_name,
        warehouse_id=p.warehouse_id,
        warehouse_name=p.warehouse.name,
        purchase_date=p.purchase_date,
        expected_date=p.expected_date,
        subtotal=p.subtotal,
        discount=p.discount,
        tax=p.tax,
        shipping_cost=p.shipping_cost,
        total_amount=p.total_amount,
        paid_amount=p.paid_amount,
        payment_status=p.payment_status,
        purchase_status=p.purchase_status,
        notes=p.notes,
        created_by_name=p.created_by.full_name,
        created_at=p.created_at,
        updated_at=p.updated_at,
        items=items
    )

@router.get("", response_model=List[PurchaseResponse])
def get_purchases(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    supplier_id: Optional[int] = None,
    purchase_status: Optional[str] = None
):
    query = db.query(Purchase)
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)
    if purchase_status:
        query = query.filter(Purchase.purchase_status == purchase_status)

    purchases = query.order_by(desc(Purchase.id)).all()
    return [format_purchase_response(p) for p in purchases]

@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(purchase_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return format_purchase_response(p)

@router.post("", response_model=PurchaseResponse)
def create_purchase(
    data: PurchaseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager", "staff"]))
):
    supplier = db.query(Supplier).filter(Supplier.id == data.supplier_id, Supplier.is_deleted == False).first()
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found")

    if not data.items:
        raise HTTPException(status_code=400, detail="Purchase order must contain at least one item")

    subtotal = 0.0
    for item in data.items:
        line_cost = (item.quantity * item.unit_cost) - item.discount
        subtotal += line_cost

    total = subtotal - data.discount + data.tax + data.shipping_cost

    pay_status = "Unpaid"
    if data.paid_amount >= total:
        pay_status = "Paid"
    elif data.paid_amount > 0:
        pay_status = "Partially Paid"

    po_status = "Received" if data.auto_receive else "Ordered"

    purchase = Purchase(
        po_number=generate_po_number(),
        supplier_id=data.supplier_id,
        warehouse_id=data.warehouse_id,
        purchase_date=data.purchase_date or None,
        expected_date=data.expected_date,
        subtotal=round(subtotal, 2),
        discount=round(data.discount, 2),
        tax=round(data.tax, 2),
        shipping_cost=round(data.shipping_cost, 2),
        total_amount=round(total, 2),
        paid_amount=round(data.paid_amount, 2),
        payment_status=pay_status,
        purchase_status=po_status,
        notes=data.notes,
        created_by_id=current_user.id
    )
    db.add(purchase)
    db.flush()

    for item in data.items:
        line_sub = (item.quantity * item.unit_cost) - item.discount
        p_item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            received_quantity=item.quantity if data.auto_receive else 0,
            unit_cost=item.unit_cost,
            discount=item.discount,
            subtotal=round(line_sub, 2)
        )
        db.add(p_item)

        # If auto_receive is true, increase stock and add stock movement immediately
        if data.auto_receive:
            stock = db.query(WarehouseStock).filter(
                WarehouseStock.warehouse_id == data.warehouse_id,
                WarehouseStock.product_id == item.product_id,
                WarehouseStock.variant_id == item.variant_id
            ).with_for_update().first()

            if not stock:
                stock = WarehouseStock(
                    warehouse_id=data.warehouse_id,
                    product_id=item.product_id,
                    variant_id=item.variant_id,
                    current_stock=0
                )
                db.add(stock)
                before_qty = 0
            else:
                before_qty = stock.current_stock

            stock.current_stock += item.quantity
            after_qty = stock.current_stock

            movement = StockMovement(
                product_id=item.product_id,
                variant_id=item.variant_id,
                warehouse_id=data.warehouse_id,
                movement_type="Purchase",
                quantity=item.quantity,
                before_quantity=before_qty,
                after_quantity=after_qty,
                reference_number=purchase.po_number,
                user_id=current_user.id,
                note=f"Goods received from supplier {supplier.company_name}"
            )
            db.add(movement)

            # Update product cost price with latest received cost
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.cost_price = item.unit_cost

    # If payment was made upfront, record payment ledger entry
    if data.paid_amount > 0:
        pay = Payment(
            transaction_type="Purchase",
            reference_id=purchase.id,
            reference_number=purchase.po_number,
            amount=data.paid_amount,
            payment_method="Cash",
            notes=f"Initial payment for purchase {purchase.po_number}",
            recorded_by_id=current_user.id
        )
        db.add(pay)

    db.commit()
    db.refresh(purchase)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Purchase",
        entity_id=str(purchase.id),
        description=f"Created PO {purchase.po_number} for ${purchase.total_amount:.2f}.",
        request=request
    )

    return format_purchase_response(purchase)

@router.post("/{purchase_id}/receive")
def receive_purchase_goods(
    purchase_id: int,
    request_data: PurchaseReceiveRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager", "staff"]))
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).with_for_update().first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    if purchase.purchase_status == "Received":
        raise HTTPException(status_code=400, detail="All items in this purchase order have already been received")

    if purchase.purchase_status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cannot receive goods for a cancelled purchase order")

    # If specific items requested or receive all remaining
    item_map = {item.id: item for item in purchase.items}
    total_received_now = 0

    if request_data.items:
        to_process = [(item_map.get(i.item_id), i.receive_quantity) for i in request_data.items if i.item_id in item_map]
    else:
        # Receive all remaining
        to_process = [(item, item.quantity - item.received_quantity) for item in purchase.items if (item.quantity - item.received_quantity) > 0]

    for p_item, qty in to_process:
        if not p_item or qty <= 0:
            continue

        remaining = p_item.quantity - p_item.received_quantity
        if qty > remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot receive {qty} units for {p_item.product.name}; only {remaining} pending."
            )

        p_item.received_quantity += qty
        total_received_now += qty

        # Stock update
        stock = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == purchase.warehouse_id,
            WarehouseStock.product_id == p_item.product_id,
            WarehouseStock.variant_id == p_item.variant_id
        ).with_for_update().first()

        if not stock:
            stock = WarehouseStock(
                warehouse_id=purchase.warehouse_id,
                product_id=p_item.product_id,
                variant_id=p_item.variant_id,
                current_stock=0
            )
            db.add(stock)
            before_qty = 0
        else:
            before_qty = stock.current_stock

        stock.current_stock += qty
        after_qty = stock.current_stock

        movement = StockMovement(
            product_id=p_item.product_id,
            variant_id=p_item.variant_id,
            warehouse_id=purchase.warehouse_id,
            movement_type="Purchase",
            quantity=qty,
            before_quantity=before_qty,
            after_quantity=after_qty,
            reference_number=purchase.po_number,
            user_id=current_user.id,
            note=f"Received PO shipment from supplier {purchase.supplier.company_name}"
        )
        db.add(movement)

        # Update product cost price
        p_item.product.cost_price = p_item.unit_cost

    # Check overall status
    all_done = all(i.received_quantity >= i.quantity for i in purchase.items)
    purchase.purchase_status = "Received" if all_done else "Partially Received"
    db.commit()

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="RECEIVE",
        entity="Purchase",
        entity_id=str(purchase.id),
        description=f"Received {total_received_now} items for PO {purchase.po_number}. Status: {purchase.purchase_status}",
        request=request
    )

    return {"message": "Goods received and inventory updated successfully", "status": purchase.purchase_status}

# --- PURCHASE RETURNS ---
@router.post("/returns", response_model=PurchaseReturnResponse)
def create_purchase_return(
    data: PurchaseReturnCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    purchase = db.query(Purchase).filter(Purchase.id == data.purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    if not data.items:
        raise HTTPException(status_code=400, detail="Return must have at least one item")

    total_return = 0.0
    for it in data.items:
        total_return += it.quantity * it.unit_cost

    p_return = PurchaseReturn(
        return_number=generate_return_number(),
        purchase_id=purchase.id,
        supplier_id=purchase.supplier_id,
        warehouse_id=purchase.warehouse_id,
        total_amount=round(total_return, 2),
        reason=data.reason,
        status="Completed",
        created_by_id=current_user.id
    )
    db.add(p_return)
    db.flush()

    for it in data.items:
        r_item = PurchaseReturnItem(
            return_id=p_return.id,
            product_id=it.product_id,
            variant_id=it.variant_id,
            quantity=it.quantity,
            unit_cost=it.unit_cost,
            subtotal=round(it.quantity * it.unit_cost, 2)
        )
        db.add(r_item)

        # Reduce stock
        stock = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == purchase.warehouse_id,
            WarehouseStock.product_id == it.product_id,
            WarehouseStock.variant_id == it.variant_id
        ).with_for_update().first()

        before_qty = stock.current_stock if stock else 0
        if before_qty < it.quantity:
            prod = db.query(Product).filter(Product.id == it.product_id).first()
            p_name = prod.name if prod else "item"
            raise HTTPException(
                status_code=400,
                detail=f"Cannot return {it.quantity} of '{p_name}'; only {before_qty} available in warehouse"
            )

        stock.current_stock -= it.quantity
        after_qty = stock.current_stock

        movement = StockMovement(
            product_id=it.product_id,
            variant_id=it.variant_id,
            warehouse_id=purchase.warehouse_id,
            movement_type="Purchase Return",
            quantity=-it.quantity,
            before_quantity=before_qty,
            after_quantity=after_qty,
            reference_number=p_return.return_number,
            user_id=current_user.id,
            note=f"Return to supplier {purchase.supplier.company_name}: {data.reason}"
        )
        db.add(movement)

    db.commit()
    db.refresh(p_return)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="RETURN",
        entity="PurchaseReturn",
        entity_id=str(p_return.id),
        description=f"Processed purchase return {p_return.return_number} for ${total_return:.2f}.",
        request=request
    )

    return PurchaseReturnResponse(
        id=p_return.id,
        return_number=p_return.return_number,
        purchase_id=purchase.id,
        po_number=purchase.po_number,
        supplier_name=purchase.supplier.company_name,
        warehouse_name=purchase.warehouse.name,
        return_date=p_return.return_date,
        total_amount=p_return.total_amount,
        reason=p_return.reason,
        status=p_return.status,
        created_by_name=current_user.full_name,
        created_at=p_return.created_at
    )
