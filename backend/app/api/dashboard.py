from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase
from app.models.finance import Expense
from app.models.stock import WarehouseStock
from app.models.product import Product
from app.models.category_brand import Category
from app.schemas.system import (
    DashboardSummaryResponse, DashboardKPIs, SalesTrendPoint,
    TopProductItem, CategoryBreakdownItem, RecentTransaction
)

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])

@router.get("", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Total Sales
    total_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0))\
        .filter(Sale.status != "Cancelled").scalar() or 0.0

    # 2. Total Purchases
    total_purchases = db.query(func.coalesce(func.sum(Purchase.total_amount), 0.0))\
        .filter(Purchase.purchase_status != "Cancelled").scalar() or 0.0

    # 3. Exact COGS from sold items snapshot
    cogs = db.query(func.coalesce(func.sum(SaleItem.quantity * SaleItem.cost_price), 0.0))\
        .join(Sale, SaleItem.sale_id == Sale.id)\
        .filter(Sale.status != "Cancelled").scalar() or 0.0

    gross_profit = total_sales - cogs
    gross_margin = (gross_profit / total_sales * 100) if total_sales > 0 else 0.0

    # 4. Operating Expenses
    operating_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).scalar() or 0.0
    net_profit = gross_profit - operating_expenses
    net_margin = (net_profit / total_sales * 100) if total_sales > 0 else 0.0

    # 5. Inventory Value
    inv_value = db.query(func.coalesce(func.sum(WarehouseStock.current_stock * Product.cost_price), 0.0))\
        .join(Product, WarehouseStock.product_id == Product.id)\
        .filter(Product.is_deleted == False).scalar() or 0.0

    # 6. Product Counts & Low Stock
    active_prods = db.query(Product).filter(Product.is_deleted == False).all()
    total_products_count = len(active_prods)

    low_stock_count = 0
    out_of_stock_count = 0
    for p in active_prods:
        st_sum = db.query(func.coalesce(func.sum(WarehouseStock.current_stock), 0))\
            .filter(WarehouseStock.product_id == p.id).scalar() or 0
        if st_sum <= 0:
            out_of_stock_count += 1
            low_stock_count += 1
        elif st_sum <= p.min_stock:
            low_stock_count += 1

    # 7. Pending Purchase Orders
    pending_po_count = db.query(Purchase).filter(
        Purchase.purchase_status.in_(["Ordered", "Partially Received"])
    ).count()

    # 8. Outstanding Receivables & Payables
    receivables = db.query(func.coalesce(func.sum(Sale.total_amount - Sale.paid_amount), 0.0))\
        .filter(Sale.status != "Cancelled").scalar() or 0.0

    payables = db.query(func.coalesce(func.sum(Purchase.total_amount - Purchase.paid_amount), 0.0))\
        .filter(Purchase.purchase_status != "Cancelled").scalar() or 0.0

    kpis = DashboardKPIs(
        total_sales=round(total_sales, 2),
        total_purchases=round(total_purchases, 2),
        cogs=round(cogs, 2),
        gross_profit=round(gross_profit, 2),
        gross_margin_percent=round(gross_margin, 1),
        operating_expenses=round(operating_expenses, 2),
        net_profit=round(net_profit, 2),
        net_margin_percent=round(net_margin, 1),
        inventory_value=round(inv_value, 2),
        total_products_count=total_products_count,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        pending_po_count=pending_po_count,
        receivables_amount=round(max(0.0, receivables), 2),
        payables_amount=round(max(0.0, payables), 2)
    )

    # 9. Sales Trend (Past 7 Days or aggregated)
    now = datetime.now(timezone.utc)
    trend_points: List[SalesTrendPoint] = []
    for day_idx in range(6, -1, -1):
        day_date = (now - timedelta(days=day_idx)).date()
        date_str = day_date.strftime("%b %d")

        # Sum of sales for that day
        day_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0))\
            .filter(func.date(Sale.sale_date) == day_date, Sale.status != "Cancelled").scalar() or 0.0

        # Sum of purchases for that day
        day_purch = db.query(func.coalesce(func.sum(Purchase.total_amount), 0.0))\
            .filter(func.date(Purchase.purchase_date) == day_date, Purchase.purchase_status != "Cancelled").scalar() or 0.0

        # Profit for that day
        day_profit = db.query(func.coalesce(func.sum(SaleItem.profit), 0.0))\
            .join(Sale, SaleItem.sale_id == Sale.id)\
            .filter(func.date(Sale.sale_date) == day_date, Sale.status != "Cancelled").scalar() or 0.0

        trend_points.append(
            SalesTrendPoint(
                date=date_str,
                sales=round(day_sales, 2),
                purchases=round(day_purch, 2),
                profit=round(day_profit, 2)
            )
        )

    # 10. Top 10 Selling Products
    top_items_query = db.query(
        SaleItem.product_id,
        func.sum(SaleItem.quantity).label("total_qty"),
        func.sum(SaleItem.subtotal).label("total_rev"),
        func.sum(SaleItem.profit).label("total_prf")
    ).join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(Sale.status != "Cancelled")\
     .group_by(SaleItem.product_id)\
     .order_by(desc("total_qty"))\
     .limit(10).all()

    top_products = []
    for row in top_items_query:
        prod = db.query(Product).filter(Product.id == row.product_id).first()
        if prod:
            top_products.append(
                TopProductItem(
                    id=prod.id,
                    name=prod.name,
                    khmer_name=prod.khmer_name,
                    sku=prod.sku,
                    quantity_sold=row.total_qty,
                    revenue=round(row.total_rev, 2),
                    profit=round(row.total_prf, 2)
                )
            )

    # 11. Category Breakdown for Donut Chart
    cat_query = db.query(
        Category.id,
        Category.name,
        Category.khmer_name,
        func.coalesce(func.sum(SaleItem.subtotal), 0.0).label("cat_total")
    ).join(Product, Product.category_id == Category.id)\
     .join(SaleItem, SaleItem.product_id == Product.id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(Sale.status != "Cancelled")\
     .group_by(Category.id, Category.name, Category.khmer_name)\
     .order_by(desc("cat_total")).all()

    category_breakdown = []
    for c in cat_query:
        pct = (c.cat_total / total_sales * 100) if total_sales > 0 else 0.0
        category_breakdown.append(
            CategoryBreakdownItem(
                category_id=c.id,
                name=c.name,
                khmer_name=c.khmer_name,
                sales_amount=round(c.cat_total, 2),
                percentage=round(pct, 1)
            )
        )

    # 12. Recent Transactions (Sales + Purchases + Expenses)
    recent_transactions: List[RecentTransaction] = []
    recent_sales = db.query(Sale).order_by(desc(Sale.id)).limit(5).all()
    for s in recent_sales:
        recent_transactions.append(
            RecentTransaction(
                id=s.id,
                transaction_number=s.invoice_number,
                type="Sale",
                party_name=s.customer.name if s.customer else "Walk-in Customer",
                amount=s.total_amount,
                date=s.sale_date,
                status=s.payment_status
            )
        )

    recent_purch = db.query(Purchase).order_by(desc(Purchase.id)).limit(5).all()
    for p in recent_purch:
        recent_transactions.append(
            RecentTransaction(
                id=p.id,
                transaction_number=p.po_number,
                type="Purchase",
                party_name=p.supplier.company_name,
                amount=p.total_amount,
                date=p.purchase_date,
                status=p.purchase_status
            )
        )

    recent_exp = db.query(Expense).order_by(desc(Expense.id)).limit(5).all()
    for e in recent_exp:
        recent_transactions.append(
            RecentTransaction(
                id=e.id,
                transaction_number=f"EXP-{e.id:04d}",
                type="Expense",
                party_name=e.category.name,
                amount=e.amount,
                date=e.expense_date,
                status="Paid"
            )
        )

    recent_transactions.sort(key=lambda x: x.date, reverse=True)

    return DashboardSummaryResponse(
        kpis=kpis,
        sales_trend=trend_points,
        top_products=top_products,
        category_breakdown=category_breakdown,
        recent_transactions=recent_transactions[:10]
    )
