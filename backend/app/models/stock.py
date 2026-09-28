from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class WarehouseStock(Base):
    __tablename__ = "warehouse_stocks"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=True, index=True)
    current_stock = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("warehouse_id", "product_id", "variant_id", name="uq_warehouse_product_variant"),
    )

    warehouse = relationship("Warehouse", back_populates="stocks")
    product = relationship("Product", back_populates="stocks")
    variant = relationship("ProductVariant", back_populates="stocks")

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    movement_type = Column(String(50), nullable=False, index=True) 
    # Types: Purchase, Sale, Purchase Return, Sale Return, Stock Adjustment, Transfer In, Transfer Out, Opening Stock
    
    quantity = Column(Integer, nullable=False)  # positive for stock in, negative for stock out
    before_quantity = Column(Integer, nullable=False)
    after_quantity = Column(Integer, nullable=False)
    
    reference_number = Column(String(100), nullable=True, index=True) # PO-xxx, INV-xxx, ADJ-xxx, TRF-xxx
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    movement_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    note = Column(Text, nullable=True)

    product = relationship("Product")
    variant = relationship("ProductVariant")
    warehouse = relationship("Warehouse")
    user = relationship("User")

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, index=True)
    transfer_number = Column(String(50), unique=True, nullable=False, index=True)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    transfer_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(30), nullable=False, default="Draft")  # Draft, Pending, Approved, Completed, Cancelled
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    destination_warehouse = relationship("Warehouse", foreign_keys=[destination_warehouse_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    items = relationship("StockTransferItem", back_populates="transfer", cascade="all, delete-orphan")

class StockTransferItem(Base):
    __tablename__ = "stock_transfer_items"

    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("stock_transfers.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, nullable=False)

    transfer = relationship("StockTransfer", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
