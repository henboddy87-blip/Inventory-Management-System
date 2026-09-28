from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = "System"
    action: str
    entity: str
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    description: str
    timestamp: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    khmer_title: Optional[str] = None
    message: str
    khmer_message: Optional[str] = None
    notification_type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardKPIs(BaseModel):
    total_sales: float
    total_purchases: float
    cogs: float
    gross_profit: float
    gross_margin_percent: float
    operating_expenses: float
    net_profit: float
    net_margin_percent: float
    inventory_value: float
    total_products_count: int
    low_stock_count: int
    out_of_stock_count: int
    pending_po_count: int
    receivables_amount: float
    payables_amount: float

class SalesTrendPoint(BaseModel):
    date: str
    sales: float
    purchases: float
    profit: float

class TopProductItem(BaseModel):
    id: int
    name: str
    khmer_name: Optional[str] = None
    sku: str
    quantity_sold: int
    revenue: float
    profit: float

class CategoryBreakdownItem(BaseModel):
    category_id: int
    name: str
    khmer_name: Optional[str] = None
    sales_amount: float
    percentage: float

class RecentTransaction(BaseModel):
    id: int
    transaction_number: str
    type: str  # Sale, Purchase, Expense
    party_name: str
    amount: float
    date: datetime
    status: str

class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKPIs
    sales_trend: List[SalesTrendPoint]
    top_products: List[TopProductItem]
    category_breakdown: List[CategoryBreakdownItem]
    recent_transactions: List[RecentTransaction]

class SettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SettingUpdate(BaseModel):
    value: str
