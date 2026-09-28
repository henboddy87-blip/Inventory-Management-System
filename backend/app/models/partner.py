from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(150), nullable=False, index=True)
    khmer_company_name = Column(String(200), nullable=True)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    province = Column(String(50), nullable=False, default="Phnom Penh")
    tax_id = Column(String(50), nullable=True)
    payment_terms = Column(String(50), nullable=True, default="Net 30")  # Cash on Delivery, Net 15, Net 30
    notes = Column(Text, nullable=True)
    status = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    purchases = relationship("Purchase", back_populates="supplier")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    khmer_name = Column(String(200), nullable=True)
    phone = Column(String(30), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    province = Column(String(50), nullable=False, default="Phnom Penh")
    customer_type = Column(String(30), nullable=False, default="Retail")  # Retail, Wholesale, VIP, Business
    credit_limit = Column(Float, default=0.0)
    current_credit = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    status = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    sales = relationship("Sale", back_populates="customer")
