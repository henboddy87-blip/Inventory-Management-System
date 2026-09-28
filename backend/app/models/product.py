from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    barcode = Column(String(50), unique=True, nullable=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    khmer_name = Column(String(255), nullable=True, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="RESTRICT"), nullable=True)
    
    cost_price = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    wholesale_price = Column(Float, nullable=True, default=0.0)
    
    min_stock = Column(Integer, nullable=False, default=5)
    max_stock = Column(Integer, nullable=True, default=1000)
    
    image_url = Column(String(500), nullable=True)
    has_variants = Column(Boolean, default=False)
    status = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False, index=True)  # Soft delete
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    unit = relationship("Unit")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    stocks = relationship("WarehouseStock", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(60), unique=True, nullable=False, index=True)
    barcode = Column(String(60), unique=True, nullable=True, index=True)
    size = Column(String(30), nullable=True)  # e.g., S, M, L, XL, 39, 40, 41
    color = Column(String(50), nullable=True)  # e.g., Black, Navy Blue, Red
    cost_price = Column(Float, nullable=True)
    selling_price = Column(Float, nullable=True)
    status = Column(Boolean, default=True)

    product = relationship("Product", back_populates="variants")
    stocks = relationship("WarehouseStock", back_populates="variant", cascade="all, delete-orphan")
