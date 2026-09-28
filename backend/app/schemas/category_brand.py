from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str
    khmer_name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    status: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    khmer_name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    status: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    children: List["CategoryResponse"] = []

    class Config:
        from_attributes = True

CategoryResponse.model_rebuild()

class BrandBase(BaseModel):
    name: str
    khmer_name: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    status: bool = True

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    khmer_name: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    status: Optional[bool] = None

class BrandResponse(BrandBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UnitResponse(BaseModel):
    id: int
    name: str
    symbol: str
    khmer_name: Optional[str] = None
    is_default: bool = False

    class Config:
        from_attributes = True

class UnitCreate(BaseModel):
    name: str
    symbol: str
    khmer_name: Optional[str] = None
    is_default: bool = False
