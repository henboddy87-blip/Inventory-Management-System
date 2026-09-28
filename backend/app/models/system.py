from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False, index=True)  # LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ADJUST, TRANSFER, RECEIVE, RETURN
    entity = Column(String(50), nullable=False, index=True)  # Product, Sale, Purchase, Stock, User, etc.
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    khmer_title = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    khmer_message = Column(Text, nullable=True)
    notification_type = Column(String(50), nullable=False, default="info")  # low_stock, out_of_stock, pending_po, payment_due, info
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
