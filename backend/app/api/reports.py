import csv
import io
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase, PurchaseItem
from app.models.finance import Expense
from app.models.stock import WarehouseStock, StockMovement
from app.models.product import Product
from app.models.partner import Customer, Supplier
from app.models.warehouse import Warehouse
from app.models.category_brand import Category

router = APIRouter(prefix="/reports", tags=["Business Reports & Analytics"])

# 1. Sales Report
@router.get("/sales")
def get_sales_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    customer_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    export_csv: bool = False
):
    query = db.query(Sale).filter(Sale.status != "Cancelled")

    if start_date:
        query = query.filter(func.date(Sale.sale_date) >= start_date)
    if end_date:
        query = query.filter(func.date(Sale.sale_date) <= end_date)
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if warehouse_id:
        query = query.filter(Sale.warehouse_id == warehouse_id)

    sales = query.order_by(desc(Sale.sale_date)).all()

    total_revenue = sum(s.total_amount for s in sales)
    total_cost = sum(sum(item.quantity * item.cost_price for item in s.items) for s in sales)
    total_profit = sum(sum(item.profit for item in s.items) for s in sales)

    items = []
    for s in sales:
        items.append({
            "invoice_number": s.invoice_number,
            "sale_date": s.sale_date.strftime("%Y-%m-%d %H:%M"),
            "customer_name": s.customer.name if s.customer else "Walk-in Customer",
            "warehouse_name": s.warehouse.name,
            "items_count": len(s.items),
            "subtotal": s.subtotal,
            "discount_amount": s.discount_amount,
            "total_amount": s.total_amount,
            "paid_amount": s.paid_amount,
            "profit": round(sum(i.profit for i in s.items), 2),
            "payment_method": s.payment_method,
            "payment_status": s.payment_status
        })

    if export_csv:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Invoice Number", "Date", "Customer", "Warehouse", "Items", "Subtotal ($)", "Discount ($)", "Total ($)", "Paid ($)", "Profit ($)", "Payment Method", "Status"])
        for it in items:
            writer.writerow([
                it["invoice_number"], it["sale_date"], it["customer_name"], it["warehouse_name"],
                it["items_count"], it["subtotal"], it["discount_amount"], it["total_amount"],
                it["paid_amount"], it["profit"], it["payment_method"], it["payment_status"]
            ])
        return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sales_report.csv"})

    return {
        "summary": {
            "total_sales_count": len(sales),
            "total_revenue": round(total_revenue, 2),
            "total_cost": round(total_cost, 2),
            "total_profit": round(total_profit, 2),
            "profit_margin_percent": round((total_profit / total_revenue * 100) if total_revenue > 0 else 0.0, 1)
        },
        "records": items
    }

# 2. Purchase Report
@router.get("/purchases")
def get_purchases_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    supplier_id: Optional[int] = None,
    export_csv: bool = False
):
    query = db.query(Purchase).filter(Purchase.purchase_status != "Cancelled")
    if start_date:
        query = query.filter(func.date(Purchase.purchase_date) >= start_date)
    if end_date:
        query = query.filter(func.date(Purchase.purchase_date) <= end_date)
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)

    purchases = query.order_by(desc(Purchase.purchase_date)).all()
    total_val = sum(p.total_amount for p in purchases)
    total_paid = sum(p.paid_amount for p in purchases)

    items = []
    for p in purchases:
        items.append({
            "po_number": p.po_number,
            "purchase_date": p.purchase_date.strftime("%Y-%m-%d %H:%M"),
            "supplier_name": p.supplier.company_name,
            "warehouse_name": p.warehouse.name,
            "total_amount": p.total_amount,
            "paid_amount": p.paid_amount,
            "payment_status": p.payment_status,
            "purchase_status": p.purchase_status
        })

    if export_csv:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["PO Number", "Date", "Supplier", "Warehouse", "Total ($)", "Paid ($)", "Payment Status", "PO Status"])
        for it in items:
            writer.writerow([it["po_number"], it["purchase_date"], it["supplier_name"], it["warehouse_name"], it["total_amount"], it["paid_amount"], it["payment_status"], it["purchase_status"]])
        return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=purchases_report.csv"})

    return {
        "summary": {
            "total_po_count": len(purchases),
            "total_purchase_amount": round(total_val, 2),
            "total_paid_amount": round(total_paid, 2),
            "total_unpaid_amount": round(max(0.0, total_val - total_paid), 2)
        },
        "records": items
    }

# 3. Inventory Valuation Report
@router.get("/inventory")
def get_inventory_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    warehouse_id: Optional[int] = None,
    category_id: Optional[int] = None,
    export_csv: bool = False
):
    query = db.query(WarehouseStock)\
        .join(Product, WarehouseStock.product_id == Product.id)\
        .filter(Product.is_deleted == False)

    if warehouse_id:
        query = query.filter(WarehouseStock.warehouse_id == warehouse_id)
    if category_id:
        query = query.filter(Product.category_id == category_id)

    stocks = query.all()
    total_items = sum(s.current_stock for s in stocks)
    total_val = sum(s.current_stock * s.product.cost_price for s in stocks)
    total_potential_rev = sum(s.current_stock * s.product.selling_price for s in stocks)

    records = []
    for s in stocks:
        st = "In Stock"
        if s.current_stock <= 0:
            st = "Out of Stock"
        elif s.current_stock <= s.product.min_stock:
            st = "Low Stock"

        records.append({
            "product_name": s.product.name,
            "sku": s.variant.sku if s.variant else s.product.sku,
            "category": s.product.category.name if s.product.category else "General",
            "warehouse": s.warehouse.name,
            "current_stock": s.current_stock,
            "min_stock": s.product.min_stock,
            "cost_price": s.product.cost_price,
            "selling_price": s.product.selling_price,
            "inventory_value": round(s.current_stock * s.product.cost_price, 2),
            "stock_status": st
        })

    if export_csv:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Product Name", "SKU", "Category", "Warehouse", "Current Stock", "Min Stock", "Cost Price ($)", "Selling Price ($)", "Inventory Value ($)", "Status"])
        for r in records:
            writer.writerow([r["product_name"], r["sku"], r["category"], r["warehouse"], r["current_stock"], r["min_stock"], r["cost_price"], r["selling_price"], r["inventory_value"], r["stock_status"]])
        return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=inventory_report.csv"})

    return {
        "summary": {
            "total_items_in_stock": total_items,
            "total_inventory_value": round(total_val, 2),
            "potential_sales_revenue": round(total_potential_rev, 2),
            "projected_profit": round(total_potential_rev - total_val, 2)
        },
        "records": records
    }

# 4. Profit & Loss (P&L) Report
@router.get("/profit")
def get_profit_loss_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    sales_q = db.query(Sale).filter(Sale.status != "Cancelled")
    exp_q = db.query(Expense)

    if start_date:
        sales_q = sales_q.filter(func.date(Sale.sale_date) >= start_date)
        exp_q = exp_q.filter(func.date(Expense.expense_date) >= start_date)
    if end_date:
        sales_q = sales_q.filter(func.date(Sale.sale_date) <= end_date)
        exp_q = exp_q.filter(func.date(Expense.expense_date) <= end_date)

    sales = sales_q.all()
    expenses = exp_q.all()

    total_revenue = sum(s.total_amount for s in sales)
    cogs = sum(sum(item.quantity * item.cost_price for item in s.items) for s in sales)
    gross_profit = total_revenue - cogs
    gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0.0

    total_expenses = sum(e.amount for e in expenses)
    net_profit = gross_profit - total_expenses
    net_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0.0

    # Expense breakdown by category
    exp_breakdown = {}
    for e in expenses:
        cat_name = e.category.name
        exp_breakdown[cat_name] = exp_breakdown.get(cat_name, 0.0) + e.amount

    return {
        "revenue": round(total_revenue, 2),
        "cost_of_goods_sold": round(cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "gross_margin_percent": round(gross_margin, 1),
        "operating_expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2),
        "net_margin_percent": round(net_margin, 1),
        "expense_breakdown": [{"category": k, "amount": round(v, 2)} for k, v in exp_breakdown.items()]
    }
