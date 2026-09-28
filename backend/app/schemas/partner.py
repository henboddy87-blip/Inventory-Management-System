from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class SupplierBase(BaseModel):
    company_name: str
    khmer_company_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    province: str = "Phnom Penh"
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = "Net 30"
    notes: Optional[str] = None
    status: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    company_name: Optional[str] = None
    khmer_company_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    province: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[bool] = None

class SupplierResponse(SupplierBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    total_purchases_count: Optional[int] = 0
    total_purchases_amount: Optional[float] = 0.0

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    name: str
    khmer_name: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    province: str = "Phnom Penh"
    customer_type: str = "Retail"  # Retail, Wholesale, VIP, Business
    credit_limit: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None
    status: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    khmer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    province: Optional[str] = None
    customer_type: Optional[str] = None
    credit_limit: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: int
    current_credit: float
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    total_sales_count: Optional[int] = 0
    total_sales_amount: Optional[float] = 0.0

    class Config:
        from_attributes = True
