from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.category_brand import Category, Brand, Unit
from app.models.product import Product
from app.schemas.category_brand import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    BrandCreate, BrandUpdate, BrandResponse,
    UnitResponse, UnitCreate
)

router = APIRouter(tags=["Categories, Brands & Units"])

# Categories
@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    categories = db.query(Category).filter(Category.parent_id == None).all()
    return categories

@router.get("/categories/all", response_model=List[CategoryResponse])
def get_all_categories_flat(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(
    data: CategoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    category = Category(
        name=data.name,
        khmer_name=data.khmer_name,
        description=data.description,
        parent_id=data.parent_id,
        status=data.status
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Category",
        entity_id=str(category.id),
        description=f"Created category '{category.name}'.",
        request=request
    )
    return category

@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if data.name is not None:
        category.name = data.name
    if data.khmer_name is not None:
        category.khmer_name = data.khmer_name
    if data.description is not None:
        category.description = data.description
    if data.parent_id is not None:
        if data.parent_id == category.id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
        category.parent_id = data.parent_id
    if data.status is not None:
        category.status = data.status

    db.commit()
    db.refresh(category)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="UPDATE",
        entity="Category",
        entity_id=str(category.id),
        description=f"Updated category '{category.name}'.",
        request=request
    )
    return category

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin"]))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if has products
    has_products = db.query(Product).filter(Product.category_id == category_id, Product.is_deleted == False).first()
    if has_products:
        raise HTTPException(status_code=400, detail="Cannot delete category containing active products")

    db.delete(category)
    db.commit()

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="DELETE",
        entity="Category",
        entity_id=str(category_id),
        description=f"Deleted category '{category.name}'.",
        request=request
    )
    return {"message": "Category deleted successfully"}

# Brands
@router.get("/brands", response_model=List[BrandResponse])
def get_brands(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Brand).all()

@router.post("/brands", response_model=BrandResponse)
def create_brand(
    data: BrandCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    brand = Brand(**data.model_dump())
    db.add(brand)
    db.commit()
    db.refresh(brand)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="Brand",
        entity_id=str(brand.id),
        description=f"Created brand '{brand.name}'.",
        request=request
    )
    return brand

# Units
@router.get("/units", response_model=List[UnitResponse])
def get_units(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Unit).all()
