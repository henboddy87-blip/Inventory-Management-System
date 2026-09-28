from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)  # Nullable for Walk-in Retail
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    sale_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    subtotal = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, nullable=False, default=0.0)
    
    payment_method = Column(String(50), nullable=False, default="Cash")  # Cash, Bank Transfer, KHQR, Card, Other
    payment_status = Column(String(30), nullable=False, default="Paid")  # Paid, Partially Paid, Unpaid, Refunded
    status = Column(String(30), nullable=False, default="Completed")     # Completed, Returned, Cancelled
    
    khqr_reference = Column(String(100), nullable=True)  # Cambodian KHQR transaction ref
    notes = Column(Text, nullable=True)
    salesperson_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="sales")
    warehouse = relationship("Warehouse")
    salesperson = relationship("User")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    returns = relationship("SaleReturn", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False, default=0.0)  # Snapshot of unit cost at sale time for exact COGS
    discount = Column(Float, default=0.0)
    subtotal = Column(Float, nullable=False)
    profit = Column(Float, nullable=False, default=0.0)      # (unit_price - cost_price) * quantity - discount

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")

class SaleReturn(Base):
    __tablename__ = "sales_returns"

    id = Column(Integer, primary_key=True, index=True)
    return_number = Column(String(50), unique=True, nullable=False, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    return_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    refund_amount = Column(Float, nullable=False, default=0.0)
    payment_method = Column(String(50), nullable=False, default="Cash")
    reason = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="Completed")
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sale = relationship("Sale", back_populates="returns")
    customer = relationship("Customer")
    warehouse = relationship("Warehouse")
    created_by = relationship("User")
    items = relationship("SaleReturnItem", back_populates="sale_return", cascade="all, delete-orphan")

class SaleReturnItem(Base):
    __tablename__ = "sales_return_items"

    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("sales_returns.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    sale_return = relationship("SaleReturn", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
