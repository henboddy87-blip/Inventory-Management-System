from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.category_brand import CategoryResponse, BrandResponse, UnitResponse

class ProductVariantBase(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    status: bool = True

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int
    current_stock: Optional[int] = 0

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: str
    khmer_name: Optional[str] = None
    description: Optional[str] = None
    category_id: int
    brand_id: Optional[int] = None
    unit_id: Optional[int] = None
    cost_price: float = Field(default=0.0, ge=0)
    selling_price: float = Field(default=0.0, ge=0)
    wholesale_price: Optional[float] = Field(default=0.0, ge=0)
    min_stock: int = Field(default=5, ge=0)
    max_stock: Optional[int] = Field(default=1000, ge=0)
    image_url: Optional[str] = None
    has_variants: bool = False
    status: bool = True

class ProductCreate(ProductBase):
    initial_stock: Optional[int] = Field(default=0, ge=0)
    warehouse_id: Optional[int] = None
    variants: Optional[List[ProductVariantCreate]] = None

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    khmer_name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    unit_id: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    min_stock: Optional[int] = None
    max_stock: Optional[int] = None
    image_url: Optional[str] = None
    has_variants: Optional[bool] = None
    status: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    brand: Optional[BrandResponse] = None
    unit: Optional[UnitResponse] = None
    variants: List[ProductVariantResponse] = []
    total_stock: Optional[int] = 0
    stock_status: Optional[str] = "In Stock"  # In Stock, Low Stock, Out of Stock, Overstock

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int
