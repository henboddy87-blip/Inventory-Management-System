from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    khmer_name = Column(String(150), nullable=True)
    description = Column(String(255), nullable=True)

    expenses = relationship("Expense", back_populates="category")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    payment_method = Column(String(50), nullable=False, default="Cash")  # Cash, Bank Transfer, KHQR, Other
    expense_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    receipt_url = Column(String(500), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    category = relationship("ExpenseCategory", back_populates="expenses")
    user = relationship("User")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    transaction_type = Column(String(30), nullable=False, index=True)  # Sale, Purchase, Expense
    reference_id = Column(Integer, nullable=False, index=True)
    reference_number = Column(String(50), nullable=False, index=True)  # INV-xxx, PO-xxx
    payment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False, default="Cash")  # Cash, Bank Transfer, KHQR, Card
    notes = Column(Text, nullable=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    recorded_by = relationship("User")
