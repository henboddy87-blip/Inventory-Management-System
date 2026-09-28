from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class WarehouseBase(BaseModel):
    name: str
    khmer_name: Optional[str] = None
    location: str
    province: str = "Phnom Penh"
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    is_default: bool = False
    status: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    khmer_name: Optional[str] = None
    location: Optional[str] = None
    province: Optional[str] = None
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    is_default: Optional[bool] = None
    status: Optional[bool] = None

class WarehouseResponse(WarehouseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    total_products: Optional[int] = 0
    total_quantity: Optional[int] = 0
    inventory_value: Optional[float] = 0.0

    class Config:
        from_attributes = True
