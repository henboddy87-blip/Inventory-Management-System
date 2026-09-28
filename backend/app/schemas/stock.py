from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class WarehouseStockResponse(BaseModel):
    id: int
    warehouse_id: int
    warehouse_name: str
    product_id: int
    product_name: str
    product_khmer_name: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    variant_id: Optional[int] = None
    variant_size: Optional[str] = None
    variant_color: Optional[str] = None
    current_stock: int
    min_stock: int
    max_stock: Optional[int] = None
    cost_price: float
    selling_price: float
    inventory_value: float
    stock_status: str  # In Stock, Low Stock, Out of Stock, Overstock
    updated_at: datetime

    class Config:
        from_attributes = True

class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    variant_id: Optional[int] = None
    variant_label: Optional[str] = None
    warehouse_id: int
    warehouse_name: str
    movement_type: str
    quantity: int
    before_quantity: int
    after_quantity: int
    reference_number: Optional[str] = None
    user_name: Optional[str] = None
    movement_date: datetime
    note: Optional[str] = None

    class Config:
        from_attributes = True

class StockAdjustmentRequest(BaseModel):
    warehouse_id: int
    product_id: int
    variant_id: Optional[int] = None
    adjusted_quantity: int = Field(description="New actual physical quantity or difference")
    is_absolute: bool = Field(default=True, description="True if adjusted_quantity is new total, False if delta")
    reason: str = Field(min_length=3, description="Reason for adjustment, e.g. Physical count discrepancy, Damaged items")

class StockTransferItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(gt=0)

class StockTransferCreate(BaseModel):
    source_warehouse_id: int
    destination_warehouse_id: int
    notes: Optional[str] = None
    items: List[StockTransferItemCreate]

class StockTransferItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    variant_id: Optional[int] = None
    variant_label: Optional[str] = None
    quantity: int

    class Config:
        from_attributes = True

class StockTransferResponse(BaseModel):
    id: int
    transfer_number: str
    source_warehouse_id: int
    source_warehouse_name: str
    destination_warehouse_id: int
    destination_warehouse_name: str
    transfer_date: datetime
    status: str  # Draft, Pending, Approved, Completed, Cancelled
    notes: Optional[str] = None
    created_by_name: str
    approved_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[StockTransferItemResponse] = []

    class Config:
        from_attributes = True
