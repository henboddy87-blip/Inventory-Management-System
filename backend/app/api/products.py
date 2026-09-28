import time
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.product import Product, ProductVariant
from app.models.category_brand import Category, Brand, Unit
from app.models.warehouse import Warehouse
from app.models.stock import WarehouseStock, StockMovement
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductVariantCreate, ProductVariantResponse
)

router = APIRouter(prefix="/products", tags=["Products & Variants"])

def generate_sku(prefix="SKU"):
    return f"{prefix}-{int(time.time()) % 1000000:06d}{random.randint(10, 99)}"

def generate_barcode():
    return f"885{random.randint(100000000, 999999999)}"

@router.get("", response_model=ProductListResponse)
def get_products(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    brand_id: Optional[int] = None,
    stock_status: Optional[str] = None, # all, in_stock, low_stock, out_of_stock
):
    query = db.query(Product).filter(Product.is_deleted == False)

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

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if brand_id:
        query = query.filter(Product.brand_id == brand_id)

    total = query.count()
    offset = (page - 1) * limit
    products = query.order_by(Product.id.desc()).offset(offset).limit(limit).all()

    items = []
    for p in products:
        # Calculate total stock across all warehouses
        stock_sum = db.query(func.coalesce(func.sum(WarehouseStock.current_stock), 0))\
            .filter(WarehouseStock.product_id == p.id).scalar() or 0

        # Determine stock status
        if stock_sum <= 0:
            status_label = "Out of Stock"
        elif stock_sum <= p.min_stock:
            status_label = "Low Stock"
        elif p.max_stock and stock_sum > p.max_stock:
            status_label = "Overstock"
        else:
            status_label = "In Stock"

        # Apply stock_status filter if requested
        if stock_status and stock_status != "all":
            if stock_status == "low_stock" and status_label != "Low Stock":
                continue
            if stock_status == "out_of_stock" and status_label != "Out of Stock":
                continue
            if stock_status == "in_stock" and status_label != "In Stock":
                continue

        p_dict = ProductResponse.model_validate(p)
        p_dict.total_stock = stock_sum
        p_dict.stock_status = status_label
        items.append(p_dict)

    pages = (total + limit - 1) // limit if total > 0 else 1

    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    stock_sum = db.query(func.coalesce(func.sum(WarehouseStock.current_stock), 0))\
        .filter(WarehouseStock.product_id == p.id).scalar() or 0

    if stock_sum <= 0:
        status_label = "Out of Stock"
    elif stock_sum <= p.min_stock:
        status_label = "Low Stock"
    else:
        status_label = "In Stock"

    resp = ProductResponse.model_validate(p)
    resp.total_stock = stock_sum
    resp.stock_status = status_label
    return resp

@router.post("", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    # Auto-generate SKU if omitted
    sku = data.sku.strip() if data.sku and data.sku.strip() else generate_sku()
    if db.query(Product).filter(Product.sku == sku, Product.is_deleted == False).first():
        raise HTTPException(status_code=400, detail=f"Product SKU '{sku}' already exists")

    # Barcode
    barcode = data.barcode.strip() if data.barcode and data.barcode.strip() else generate_barcode()
    if db.query(Product).filter(Product.barcode == barcode, Product.is_deleted == False).first():
        raise HTTPException(status_code=400, detail=f"Barcode '{barcode}' already exists")

    # Validate category
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid Category ID")

    product = Product(
        sku=sku,
        barcode=barcode,
        name=data.name,
        khmer_name=data.khmer_name,
        description=data.description,
        category_id=data.category_id,
        brand_id=data.brand_id,
        unit_id=data.unit_id,
        cost_price=data.cost_price,
        selling_price=data.selling_price,
        wholesale_price=data.wholesale_price or data.selling_price,
        min_stock=data.min_stock,
        max_stock=data.max_stock,
        image_url=data.image_url,
        has_variants=bool(data.variants and len(data.variants) > 0),
        status=data.status
    )
    db.add(product)
    db.flush()

    # Process variants if any
    if data.variants:
        for idx, var in enumerate(data.variants):
            v_sku = var.sku.strip() if var.sku and var.sku.strip() else f"{sku}-V{idx+1}"
            v_barcode = var.barcode.strip() if var.barcode and var.barcode.strip() else f"{barcode}{idx+1}"
            variant = ProductVariant(
                product_id=product.id,
                sku=v_sku,
                barcode=v_barcode,
                size=var.size,
                color=var.color,
                cost_price=var.cost_price or data.cost_price,
                selling_price=var.selling_price or data.selling_price,
                status=var.status
            )
            db.add(variant)

    # Initial Opening Stock handling
    if data.initial_stock and data.initial_stock > 0:
        warehouse_id = data.warehouse_id
        if not warehouse_id:
            default_wh = db.query(Warehouse).filter(Warehouse.is_default == True).first()
            if not default_wh:
                default_wh = db.query(Warehouse).first()
            warehouse_id = default_wh.id if default_wh else None

        if warehouse_id:
            wh_stock = WarehouseStock(
                warehouse_id=warehouse_id,
                product_id=product.id,
                variant_id=None,
                current_stock=data.initial_stock
            )
            db.add(wh_stock)

            movement = StockMovement(
                product_id=product.id,
                variant_id=None,
                warehouse_id=warehouse_id,
                movement_type="Opening Stock",
                quantity=data.initial_stock,
                before_quantity=0,
                after_quantity=data.initial_stock,
                reference_number=f"OPN-{product.sku}",
                user_id=current_user.id,
                note="Initial opening stock recorded at product creation"
            )
            db.add(movement)

    db.commit()
    db.refresh(product)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Product",
        entity_id=str(product.id),
        description=f"Created product '{product.name}' (SKU: {product.sku}).",
        request=request
    )

    resp = ProductResponse.model_validate(product)
    resp.total_stock = data.initial_stock or 0
    resp.stock_status = "In Stock" if (data.initial_stock or 0) > product.min_stock else "Low Stock"
    return resp

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if data.sku and data.sku != product.sku:
        if db.query(Product).filter(Product.sku == data.sku, Product.id != product_id, Product.is_deleted == False).first():
            raise HTTPException(status_code=400, detail="SKU already in use by another product")
        product.sku = data.sku

    if data.barcode and data.barcode != product.barcode:
        if db.query(Product).filter(Product.barcode == data.barcode, Product.id != product_id, Product.is_deleted == False).first():
            raise HTTPException(status_code=400, detail="Barcode already in use by another product")
        product.barcode = data.barcode

    for key, val in data.model_dump(exclude_unset=True, exclude={"sku", "barcode"}).items():
        setattr(product, key, val)

    db.commit()
    db.refresh(product)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="UPDATE",
        entity="Product",
        entity_id=str(product.id),
        description=f"Updated product details for '{product.name}'.",
        request=request
    )

    return get_product(product_id=product.id, db=db, current_user=current_user)

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin"]))
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Soft deletion
    product.is_deleted = True
    db.commit()

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="DELETE",
        entity="Product",
        entity_id=str(product_id),
        description=f"Soft-deleted product '{product.name}' (SKU: {product.sku}).",
        request=request
    )

    return {"message": "Product deleted successfully"}
