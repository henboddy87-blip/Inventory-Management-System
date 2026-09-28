from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ExpenseCategoryResponse(BaseModel):
    id: int
    name: str
    khmer_name: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ExpenseCategoryCreate(BaseModel):
    name: str
    khmer_name: Optional[str] = None
    description: Optional[str] = None

class ExpenseCreate(BaseModel):
    category_id: int
    amount: float = Field(gt=0)
    description: str
    payment_method: str = "Cash"
    expense_date: Optional[datetime] = None
    receipt_url: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    category_id: int
    category_name: str
    category_khmer_name: Optional[str] = None
    amount: float
    description: str
    payment_method: str
    expense_date: datetime
    receipt_url: Optional[str] = None
    user_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    transaction_type: str  # Sale, Purchase
    reference_id: int
    amount: float = Field(gt=0)
    payment_method: str = "Cash"
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    transaction_type: str
    reference_id: int
    reference_number: str
    payment_date: datetime
    amount: float
    payment_method: str
    notes: Optional[str] = None
    recorded_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True
