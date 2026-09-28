import time
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.stock import WarehouseStock, StockMovement, StockTransfer, StockTransferItem
from app.models.product import Product, ProductVariant
from app.models.warehouse import Warehouse
from app.models.user import User
from app.schemas.stock import (
    WarehouseStockResponse, StockMovementResponse, StockAdjustmentRequest,
    StockTransferCreate, StockTransferResponse
)

router = APIRouter(prefix="/inventory", tags=["Inventory Engine"])

def generate_transfer_number():
    return f"TRF-{int(time.time()) % 1000000:06d}{random.randint(10, 99)}"

@router.get("", response_model=List[WarehouseStockResponse])
def get_inventory_stocks(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    warehouse_id: Optional[int] = None,
    stock_status: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(WarehouseStock)\
        .join(Product, WarehouseStock.product_id == Product.id)\
        .filter(Product.is_deleted == False)

    if warehouse_id:
        query = query.filter(WarehouseStock.warehouse_id == warehouse_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(s),
                Product.khmer_name.ilike(s),
                Product.sku.ilike(s),
                Product.barcode.ilike(s)
            )
        )

    records = query.order_by(WarehouseStock.warehouse_id, Product.name).all()
    results = []

    for item in records:
        prod = item.product
        var = item.variant
        curr = item.current_stock
        min_s = prod.min_stock
        max_s = prod.max_stock

        if curr <= 0:
            st = "Out of Stock"
        elif curr <= min_s:
            st = "Low Stock"
        elif max_s and curr > max_s:
            st = "Overstock"
        else:
            st = "In Stock"

        if stock_status:
            if stock_status == "low_stock" and st != "Low Stock":
                continue
            if stock_status == "out_of_stock" and st != "Out of Stock":
                continue
            if stock_status == "in_stock" and st != "In Stock":
                continue
            if stock_status == "overstock" and st != "Overstock":
                continue

        cost = (var.cost_price if var and var.cost_price is not None else prod.cost_price) or 0.0
        sell = (var.selling_price if var and var.selling_price is not None else prod.selling_price) or 0.0

        results.append(
            WarehouseStockResponse(
                id=item.id,
                warehouse_id=item.warehouse_id,
                warehouse_name=item.warehouse.name,
                product_id=prod.id,
                product_name=prod.name,
                product_khmer_name=prod.khmer_name,
                sku=var.sku if var else prod.sku,
                barcode=var.barcode if var else prod.barcode,
                variant_id=var.id if var else None,
                variant_size=var.size if var else None,
                variant_color=var.color if var else None,
                current_stock=curr,
                min_stock=min_s,
                max_stock=max_s,
                cost_price=cost,
                selling_price=sell,
                inventory_value=round(curr * cost, 2),
                stock_status=st,
                updated_at=item.updated_at
            )
        )

    return results

@router.get("/movements", response_model=List[StockMovementResponse])
def get_stock_movements(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500)
):
    query = db.query(StockMovement).join(Product, StockMovement.product_id == Product.id)

    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    if warehouse_id:
        query = query.filter(StockMovement.warehouse_id == warehouse_id)
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)

    movements = query.order_by(desc(StockMovement.movement_date)).limit(limit).all()

    results = []
    for m in movements:
        var_label = None
        if m.variant:
            parts = [p for p in [m.variant.size, m.variant.color] if p]
            var_label = "/".join(parts) if parts else m.variant.sku

        results.append(
            StockMovementResponse(
                id=m.id,
                product_id=m.product_id,
                product_name=m.product.name,
                product_sku=m.variant.sku if m.variant else m.product.sku,
                variant_id=m.variant_id,
                variant_label=var_label,
                warehouse_id=m.warehouse_id,
                warehouse_name=m.warehouse.name,
                movement_type=m.movement_type,
                quantity=m.quantity,
                before_quantity=m.before_quantity,
                after_quantity=m.after_quantity,
                reference_number=m.reference_number,
                user_name=m.user.full_name if m.user else "System",
                movement_date=m.movement_date,
                note=m.note
            )
        )
    return results

@router.post("/adjust")
def adjust_stock(
    data: StockAdjustmentRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    # Lock and fetch current stock
    stock_record = db.query(WarehouseStock).filter(
        WarehouseStock.warehouse_id == data.warehouse_id,
        WarehouseStock.product_id == data.product_id,
        WarehouseStock.variant_id == data.variant_id
    ).with_for_update().first()

    before_qty = stock_record.current_stock if stock_record else 0

    if data.is_absolute:
        after_qty = data.adjusted_quantity
        diff = after_qty - before_qty
    else:
        diff = data.adjusted_quantity
        after_qty = before_qty + diff

    if after_qty < 0:
        raise HTTPException(status_code=400, detail="Stock level cannot be negative after adjustment")

    if not stock_record:
        stock_record = WarehouseStock(
            warehouse_id=data.warehouse_id,
            product_id=data.product_id,
            variant_id=data.variant_id,
            current_stock=after_qty
        )
        db.add(stock_record)
    else:
        stock_record.current_stock = after_qty

    adj_ref = f"ADJ-{int(time.time()) % 1000000:06d}"
    movement = StockMovement(
        product_id=data.product_id,
        variant_id=data.variant_id,
        warehouse_id=data.warehouse_id,
        movement_type="Stock Adjustment",
        quantity=diff,
        before_quantity=before_qty,
        after_quantity=after_qty,
        reference_number=adj_ref,
        user_id=current_user.id,
        note=f"{data.reason} (Delta: {diff:+d})"
    )
    db.add(movement)
    db.commit()

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="ADJUST",
        entity="Stock",
        entity_id=str(data.product_id),
        description=f"Stock adjusted by {diff:+d} units (From {before_qty} to {after_qty}). Reason: {data.reason}",
        request=request
    )

    return {
        "message": "Stock adjusted successfully",
        "before_quantity": before_qty,
        "after_quantity": after_qty,
        "delta": diff,
        "reference_number": adj_ref
    }

# --- STOCK TRANSFERS ---
@router.get("/transfers", response_model=List[StockTransferResponse])
def get_transfers(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    transfers = db.query(StockTransfer).order_by(desc(StockTransfer.id)).all()
    results = []
    for t in transfers:
        items = []
        for i in t.items:
            var_label = None
            if i.variant:
                parts = [p for p in [i.variant.size, i.variant.color] if p]
                var_label = "/".join(parts) if parts else i.variant.sku
            items.append({
                "id": i.id,
                "product_id": i.product_id,
                "product_name": i.product.name,
                "sku": i.variant.sku if i.variant else i.product.sku,
                "variant_id": i.variant_id,
                "variant_label": var_label,
                "quantity": i.quantity
            })

        results.append(
            StockTransferResponse(
                id=t.id,
                transfer_number=t.transfer_number,
                source_warehouse_id=t.source_warehouse_id,
                source_warehouse_name=t.source_warehouse.name,
                destination_warehouse_id=t.destination_warehouse_id,
                destination_warehouse_name=t.destination_warehouse.name,
                transfer_date=t.transfer_date,
                status=t.status,
                notes=t.notes,
                created_by_name=t.created_by.full_name,
                approved_by_name=t.approved_by.full_name if t.approved_by else None,
                created_at=t.created_at,
                updated_at=t.updated_at,
                items=items
            )
        )
    return results

@router.post("/transfers", response_model=StockTransferResponse)
def create_stock_transfer(
    data: StockTransferCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    if data.source_warehouse_id == data.destination_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination warehouses cannot be the same")

    if not data.items:
        raise HTTPException(status_code=400, detail="Transfer must contain at least one item")

    # Validate stock availability in source warehouse
    for item in data.items:
        st = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == data.source_warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id
        ).first()

        avail = st.current_stock if st else 0
        if avail < item.quantity:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            p_name = prod.name if prod else "item"
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{p_name}'. Available: {avail}, Requested: {item.quantity}"
            )

    transfer = StockTransfer(
        transfer_number=generate_transfer_number(),
        source_warehouse_id=data.source_warehouse_id,
        destination_warehouse_id=data.destination_warehouse_id,
        notes=data.notes,
        status="Pending",
        created_by_id=current_user.id
    )
    db.add(transfer)
    db.flush()

    for item in data.items:
        t_item = StockTransferItem(
            transfer_id=transfer.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity
        )
        db.add(t_item)

    db.commit()
    db.refresh(transfer)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="StockTransfer",
        entity_id=str(transfer.id),
        description=f"Created stock transfer {transfer.transfer_number} from warehouse {transfer.source_warehouse.name} to {transfer.destination_warehouse.name}.",
        request=request
    )

    return get_transfers(db=db, current_user=current_user)[0]

@router.post("/transfers/{transfer_id}/complete")
def complete_stock_transfer(
    transfer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id).with_for_update().first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Stock transfer not found")

    if transfer.status == "Completed":
        raise HTTPException(status_code=400, detail="Stock transfer is already completed")

    if transfer.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cannot complete a cancelled transfer")

    # Perform atomic transfer across warehouses
    for item in transfer.items:
        # 1. Decrement source warehouse
        src_stock = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == transfer.source_warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id
        ).with_for_update().first()

        src_before = src_stock.current_stock if src_stock else 0
        if src_before < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Source warehouse does not have enough stock for {item.product.name} (Available: {src_before}, Needed: {item.quantity})"
            )

        src_stock.current_stock -= item.quantity
        src_after = src_stock.current_stock

        # Movement: Transfer Out
        m_out = StockMovement(
            product_id=item.product_id,
            variant_id=item.variant_id,
            warehouse_id=transfer.source_warehouse_id,
            movement_type="Transfer Out",
            quantity=-item.quantity,
            before_quantity=src_before,
            after_quantity=src_after,
            reference_number=transfer.transfer_number,
            user_id=current_user.id,
            note=f"Transferred to {transfer.destination_warehouse.name}"
        )
        db.add(m_out)

        # 2. Increment destination warehouse
        dest_stock = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == transfer.destination_warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id
        ).with_for_update().first()

        if not dest_stock:
            dest_stock = WarehouseStock(
                warehouse_id=transfer.destination_warehouse_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                current_stock=0
            )
            db.add(dest_stock)
            dest_before = 0
        else:
            dest_before = dest_stock.current_stock

        dest_stock.current_stock += item.quantity
        dest_after = dest_stock.current_stock

        # Movement: Transfer In
        m_in = StockMovement(
            product_id=item.product_id,
            variant_id=item.variant_id,
            warehouse_id=transfer.destination_warehouse_id,
            movement_type="Transfer In",
            quantity=item.quantity,
            before_quantity=dest_before,
            after_quantity=dest_after,
            reference_number=transfer.transfer_number,
            user_id=current_user.id,
            note=f"Transferred from {transfer.source_warehouse.name}"
        )
        db.add(m_in)

    transfer.status = "Completed"
    transfer.approved_by_id = current_user.id
    db.commit()

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="TRANSFER",
        entity="StockTransfer",
        entity_id=str(transfer.id),
        description=f"Completed stock transfer {transfer.transfer_number}.",
        request=request
    )

    return {"message": "Stock transfer completed and inventory updated successfully"}
