"""E2E backend smoke/regression tests for Sistem Operasional UMKM."""
import os
import uuid
import pytest
import requests

import re
from pathlib import Path

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bisnis-hub-12.preview.emergentagent.com").rstrip("/")
OWNER_EMAIL = "muhamad.widiono98@gmail.com"

OWNER_PASSWORD = os.environ.get("OWNER_PASSWORD")
if not OWNER_PASSWORD:
    try:
        cred_text = Path("/app/memory/test_credentials.md").read_text()
        match = re.search(r"Password:\s*`([^`]+)`", cred_text)
        if match:
            OWNER_PASSWORD = match.group(1)
    except Exception:
        pass
if not OWNER_PASSWORD:
    OWNER_PASSWORD = "Password123!"  # Safe default test fallback if file is not found



@pytest.fixture(scope="session")
def owner_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        # Code-review flags (warnings; not failing test):
        user = data.get("user", {})
        if "_id" in user:
            print("WARN: MongoDB _id leaked in login response")
        if "password_hash" in user:
            print("WARN: password_hash leaked in login response")

    def test_login_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": OWNER_EMAIL, "password": "wrong"})
        assert r.status_code in (400, 401, 403)

    def test_auth_me(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        payload = r.json()
        # /auth/me returns { user: {...}, tenant: {...} }
        user = payload.get("user", payload)
        assert user.get("email") == OWNER_EMAIL


# ---------- Dashboard ----------
class TestDashboard:
    def test_stats(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        assert r.status_code == 200
        for k in ("total_revenue", "total_sales", "total_receivable", "low_stock_count"):
            assert k in r.json()

    def test_subscription(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/dashboard/subscription", headers=auth_headers)
        assert r.status_code == 200
        assert "package" in r.json()


# ---------- Products ----------
class TestProducts:
    def test_create_and_list_product(self, auth_headers):
        pid = f"prod-test-{uuid.uuid4().hex[:6]}"
        payload = {
            "product_id": pid, "tenant_id": "tenant-default",
            "name": f"TEST_Product_{pid}", "price": 15000, "unit": "pcs",
            "stock": 50, "min_stock": 5, "category": "product",
        }
        r = requests.post(f"{BASE_URL}/api/products", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["name"] == payload["name"]
        actual_pid = created["product_id"]
        if "_id" in created:
            print("WARN: MongoDB _id leaked in product response")

        lst = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        assert lst.status_code == 200
        assert any(p["product_id"] == actual_pid for p in lst.json())
        # cleanup
        requests.delete(f"{BASE_URL}/api/products/{actual_pid}", headers=auth_headers)


# ---------- Customers ----------
class TestCustomers:
    def test_create_and_list_customer(self, auth_headers):
        cid = f"cust-test-{uuid.uuid4().hex[:6]}"
        payload = {
            "customer_id": cid, "tenant_id": "tenant-default",
            "name": f"TEST_Customer_{cid}", "phone": "081234567890",
            "address": "Jl. Test 123",
        }
        r = requests.post(f"{BASE_URL}/api/customers", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["name"] == payload["name"]
        actual_cid = created["customer_id"]

        lst = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        assert lst.status_code == 200
        assert any(c["customer_id"] == actual_cid for c in lst.json())
        requests.delete(f"{BASE_URL}/api/customers/{actual_cid}", headers=auth_headers)


# ---------- Transactions ----------
class TestTransactions:
    def test_create_transaction_flow(self, auth_headers):
        # create product + customer first
        pid = f"prod-tx-{uuid.uuid4().hex[:6]}"
        pcreate = requests.post(f"{BASE_URL}/api/products", headers=auth_headers, json={
            "product_id": pid, "tenant_id": "tenant-default",
            "name": f"TEST_TxProduct_{pid}", "price": 20000, "unit": "pcs",
            "stock": 100, "min_stock": 5, "category": "product",
        })
        pcreate.raise_for_status()
        real_pid = pcreate.json()["product_id"]

        cid = f"cust-tx-{uuid.uuid4().hex[:6]}"
        ccreate = requests.post(f"{BASE_URL}/api/customers", headers=auth_headers, json={
            "customer_id": cid, "tenant_id": "tenant-default",
            "name": f"TEST_TxCust_{cid}", "phone": "08111", "address": "x",
        })
        ccreate.raise_for_status()
        real_cid = ccreate.json()["customer_id"]

        tx_payload = {
            "customer_id": real_cid,
            "items": [{"product_id": real_pid, "name": "TEST", "price": 20000, "quantity": 2, "subtotal": 40000}],
            "discount": 0, "tax": 0, "payment_method": "Cash", "amount_paid": 40000,
        }
        r = requests.post(f"{BASE_URL}/api/transactions", headers=auth_headers, json=tx_payload)
        assert r.status_code == 200, r.text
        tx = r.json()
        assert tx["total"] == 40000
        assert tx["invoice_no"]

        # list
        lst = requests.get(f"{BASE_URL}/api/transactions", headers=auth_headers)
        assert lst.status_code == 200
        assert any(t["transaction_id"] == tx["transaction_id"] for t in lst.json())


# ---------- WA & Audit ----------
class TestLogs:
    def test_whatsapp_logs(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/whatsapp/logs", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_audit_logs(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/audit-logs", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Billing upgrade ----------
class TestBilling:
    def test_upgrade_pro(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/dashboard/upgrade", headers=auth_headers,
                          json={"package": "Pro"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("package") == "Pro"
        assert "snap_token" in data
