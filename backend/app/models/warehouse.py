from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    khmer_name = Column(String(150), nullable=True)
    location = Column(String(255), nullable=False)
    province = Column(String(50), nullable=False, default="Phnom Penh")  # Cambodian province
    phone = Column(String(30), nullable=True)
    manager_name = Column(String(100), nullable=True)
    is_default = Column(Boolean, default=False)
    status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    stocks = relationship("WarehouseStock", back_populates="warehouse", cascade="all, delete-orphan")
