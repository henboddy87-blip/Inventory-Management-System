from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class PurchaseItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(gt=0)
    unit_cost: float = Field(ge=0)
    discount: float = Field(default=0.0, ge=0)

class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    variant_id: Optional[int] = None
    variant_label: Optional[str] = None
    quantity: int
    received_quantity: int
    unit_cost: float
    discount: float
    subtotal: float

    class Config:
        from_attributes = True

class PurchaseCreate(BaseModel):
    supplier_id: int
    warehouse_id: int
    purchase_date: Optional[datetime] = None
    expected_date: Optional[datetime] = None
    discount: float = Field(default=0.0, ge=0)
    tax: float = Field(default=0.0, ge=0)
    shipping_cost: float = Field(default=0.0, ge=0)
    paid_amount: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None
    auto_receive: bool = Field(default=False, description="Immediately mark as received and stock in")
    items: List[PurchaseItemCreate]

class PurchaseResponse(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    supplier_name: str
    warehouse_id: int
    warehouse_name: str
    purchase_date: datetime
    expected_date: Optional[datetime] = None
    subtotal: float
    discount: float
    tax: float
    shipping_cost: float
    total_amount: float
    paid_amount: float
    payment_status: str  # Paid, Partially Paid, Unpaid
    purchase_status: str # Draft, Ordered, Partially Received, Received, Cancelled
    notes: Optional[str] = None
    created_by_name: str
    created_at: datetime
    updated_at: datetime
    items: List[PurchaseItemResponse] = []

    class Config:
        from_attributes = True

class PurchaseReceiveItem(BaseModel):
    item_id: int
    receive_quantity: int = Field(gt=0)

class PurchaseReceiveRequest(BaseModel):
    items: Optional[List[PurchaseReceiveItem]] = None  # If empty, receives all remaining pending quantities

class PurchaseReturnItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(gt=0)
    unit_cost: float = Field(ge=0)

class PurchaseReturnCreate(BaseModel):
    purchase_id: int
    reason: str
    items: List[PurchaseReturnItemCreate]

class PurchaseReturnResponse(BaseModel):
    id: int
    return_number: str
    purchase_id: int
    po_number: str
    supplier_name: str
    warehouse_name: str
    return_date: datetime
    total_amount: float
    reason: str
    status: str
    created_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True
