from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class SaleItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    discount: float = Field(default=0.0, ge=0)

class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_khmer_name: Optional[str] = None
    sku: str
    variant_id: Optional[int] = None
    variant_label: Optional[str] = None
    quantity: int
    unit_price: float
    cost_price: float
    discount: float
    subtotal: float
    profit: float

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None  # None for Walk-in Retail
    warehouse_id: int
    discount_amount: float = Field(default=0.0, ge=0)
    tax_amount: float = Field(default=0.0, ge=0)
    paid_amount: float = Field(default=0.0, ge=0)
    payment_method: str = "Cash"  # Cash, Bank Transfer, KHQR, Card, Other
    khqr_reference: Optional[str] = None
    notes: Optional[str] = None
    items: List[SaleItemCreate]

class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = "Walk-in Customer"
    customer_phone: Optional[str] = None
    warehouse_id: int
    warehouse_name: str
    sale_date: datetime
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    paid_amount: float
    due_amount: float = 0.0
    payment_method: str
    payment_status: str  # Paid, Partially Paid, Unpaid, Refunded
    status: str          # Completed, Returned, Cancelled
    khqr_reference: Optional[str] = None
    notes: Optional[str] = None
    salesperson_name: str
    created_at: datetime
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True

class SaleReturnItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)

class SaleReturnCreate(BaseModel):
    sale_id: int
    reason: str
    payment_method: str = "Cash"
    items: List[SaleReturnItemCreate]

class SaleReturnResponse(BaseModel):
    id: int
    return_number: str
    sale_id: int
    invoice_number: str
    customer_name: Optional[str] = None
    warehouse_name: str
    return_date: datetime
    refund_amount: float
    payment_method: str
    reason: str
    status: str
    created_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True
