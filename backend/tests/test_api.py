import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.stock import WarehouseStock, StockMovement
from app.models.product import Product

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "currency_default" in data

def test_admin_login():
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Admin123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"]["name"] == "super_admin"

def test_invalid_login():
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_get_dashboard_analytics():
    # Login
    auth_resp = client.post("/api/auth/login", json={"username": "admin", "password": "Admin123!"})
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash_resp = client.get("/api/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    data = dash_resp.json()
    assert "kpis" in data
    assert data["kpis"]["total_sales"] > 0
    assert "sales_trend" in data
    assert len(data["sales_trend"]) == 7

def test_inventory_and_sales_flow():
    # Login as admin
    auth_resp = client.post("/api/auth/login", json={"username": "admin", "password": "Admin123!"})
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch products
    prod_resp = client.get("/api/products", headers=headers)
    assert prod_resp.status_code == 200
    products = prod_resp.json()["items"]
    assert len(products) > 0
    test_prod = products[0]

    # Get current stock
    wh_resp = client.get("/api/warehouses", headers=headers)
    assert wh_resp.status_code == 200
    wh_id = wh_resp.json()[0]["id"]

    inv_resp = client.get(f"/api/inventory?warehouse_id={wh_id}&search={test_prod['sku']}", headers=headers)
    assert inv_resp.status_code == 200
    initial_stock = inv_resp.json()[0]["current_stock"]

    # 2. Perform a sale
    sale_payload = {
        "customer_id": None,
        "warehouse_id": wh_id,
        "payment_method": "KHQR",
        "paid_amount": test_prod["selling_price"],
        "discount_amount": 0.0,
        "tax_amount": 0.0,
        "items": [
            {
                "product_id": test_prod["id"],
                "quantity": 1,
                "unit_price": test_prod["selling_price"],
                "discount": 0.0
            }
        ]
    }
    sale_resp = client.post("/api/sales", json=sale_payload, headers=headers)
    assert sale_resp.status_code == 200
    sale_data = sale_resp.json()
    assert sale_data["status"] == "Completed"
    assert sale_data["payment_method"] == "KHQR"

    # 3. Verify inventory decreased by 1
    inv_after = client.get(f"/api/inventory?warehouse_id={wh_id}&search={test_prod['sku']}", headers=headers)
    new_stock = inv_after.json()[0]["current_stock"]
    assert new_stock == initial_stock - 1

    # 4. Verify Stock Movement was recorded
    movements_resp = client.get(f"/api/inventory/movements?product_id={test_prod['id']}", headers=headers)
    assert movements_resp.status_code == 200
    latest_mov = movements_resp.json()[0]
    assert latest_mov["movement_type"] == "Sale"
    assert latest_mov["quantity"] == -1
