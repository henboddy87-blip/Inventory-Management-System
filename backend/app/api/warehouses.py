from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.warehouse import Warehouse
from app.models.stock import WarehouseStock
from app.models.product import Product
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseResponse

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

@router.get("", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    warehouses = db.query(Warehouse).all()
    results = []
    for w in warehouses:
        # Calculate stats
        stock_stats = db.query(
            func.count(func.distinct(WarehouseStock.product_id)).label("total_products"),
            func.coalesce(func.sum(WarehouseStock.current_stock), 0).label("total_quantity")
        ).filter(WarehouseStock.warehouse_id == w.id).first()

        # Calculate inventory valuation for this warehouse
        value_query = db.query(
            func.coalesce(func.sum(WarehouseStock.current_stock * Product.cost_price), 0.0)
        ).join(Product, WarehouseStock.product_id == Product.id)\
         .filter(WarehouseStock.warehouse_id == w.id).scalar()

        item = WarehouseResponse(
            id=w.id,
            name=w.name,
            khmer_name=w.khmer_name,
            location=w.location,
            province=w.province,
            phone=w.phone,
            manager_name=w.manager_name,
            is_default=w.is_default,
            status=w.status,
            created_at=w.created_at,
            updated_at=w.updated_at,
            total_products=stock_stats.total_products or 0,
            total_quantity=stock_stats.total_quantity or 0,
            inventory_value=float(value_query or 0.0)
        )
        results.append(item)
    return results

@router.post("", response_model=WarehouseResponse)
def create_warehouse(
    data: WarehouseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin"]))
):
    if db.query(Warehouse).filter(Warehouse.name == data.name).first():
        raise HTTPException(status_code=400, detail="Warehouse name already exists")

    if data.is_default:
        db.query(Warehouse).update({"is_default": False})

    warehouse = Warehouse(**data.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Warehouse",
        entity_id=str(warehouse.id),
        description=f"Created warehouse '{warehouse.name}' in {warehouse.province}.",
        request=request
    )

    return WarehouseResponse(
        id=warehouse.id,
        name=warehouse.name,
        khmer_name=warehouse.khmer_name,
        location=warehouse.location,
        province=warehouse.province,
        phone=warehouse.phone,
        manager_name=warehouse.manager_name,
        is_default=warehouse.is_default,
        status=warehouse.status,
        created_at=warehouse.created_at,
        updated_at=warehouse.updated_at,
        total_products=0,
        total_quantity=0,
        inventory_value=0.0
    )

@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: int,
    data: WarehouseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin"]))
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    if data.name and data.name != warehouse.name:
        if db.query(Warehouse).filter(Warehouse.name == data.name).first():
            raise HTTPException(status_code=400, detail="Warehouse name already exists")
        warehouse.name = data.name

    if data.is_default:
        db.query(Warehouse).filter(Warehouse.id != warehouse_id).update({"is_default": False})
        warehouse.is_default = True
    elif data.is_default is False:
        warehouse.is_default = False

    for key, val in data.model_dump(exclude_unset=True, exclude={"name", "is_default"}).items():
        setattr(warehouse, key, val)

    db.commit()
    db.refresh(warehouse)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="UPDATE",
        entity="Warehouse",
        entity_id=str(warehouse.id),
        description=f"Updated warehouse '{warehouse.name}'.",
        request=request
    )

    return WarehouseResponse(
        id=warehouse.id,
        name=warehouse.name,
        khmer_name=warehouse.khmer_name,
        location=warehouse.location,
        province=warehouse.province,
        phone=warehouse.phone,
        manager_name=warehouse.manager_name,
        is_default=warehouse.is_default,
        status=warehouse.status,
        created_at=warehouse.created_at,
        updated_at=warehouse.updated_at
    )
