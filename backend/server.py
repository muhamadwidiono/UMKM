from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Cookie, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import jwt
import bcrypt
import logging
import uuid
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Dict, Any, Annotated
from datetime import datetime, timezone, timedelta
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-key-widiono-umkm-saas")
JWT_ALGORITHM = "HS256"

# Pydantic & MongoDB Mapping Helpers
PyObjectId = Annotated[str, BeforeValidator(str)]

class BaseDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        extra="ignore"
    )
    # Exclude MongoDB ID from response serialization
    id: PyObjectId = Field(default_factory=lambda: str(ObjectId()), alias="_id", exclude=True)

def to_mongo_dict(model_instance: BaseModel) -> Dict[str, Any]:
    d = model_instance.model_dump(by_alias=True)
    return d

# --- Pydantic Schemas ---

class Tenant(BaseDocument):
    tenant_id: str
    name: str
    type: str  # laundry, bengkel, toko
    package: str = "Pro"  # Gratis, Basic, Pro
    max_transactions_limit: int = -1  # -1 for unlimited
    transaction_count: int = 0
    owner_email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseDocument):
    user_id: str
    tenant_id: str
    email: str
    name: str
    role: str  # Super Admin, Owner, Staff
    password_hash: Optional[str] = Field(None, exclude=True) # Exclude password hash from response serialization
    picture: Optional[str] = "https://images.unsplash.com/photo-1735948055457-8d816fb80a87"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Customer(BaseDocument):
    customer_id: str
    tenant_id: str
    name: str
    phone: str
    address: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseDocument):
    product_id: str
    tenant_id: str
    name: str
    price: float
    stock: int
    min_stock: int = 5
    unit: str = "pcs"  # pcs, kg, ltr, jasa
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockMovement(BaseDocument):
    mutation_id: str
    tenant_id: str
    product_id: str
    product_name: str
    qty_change: int
    type: str  # sale, purchase, adjustment, initial
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    subtotal: float

class Transaction(BaseDocument):
    transaction_id: str
    tenant_id: str
    invoice_no: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = "Walk-in Customer"
    items: List[TransactionItem]
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    total: float
    amount_paid: float
    payment_status: str  # Lunas, Partial, Kasbon
    payment_method: str  # Cash, QRIS, Transfer, Kasbon
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WhatsAppLog(BaseDocument):
    log_id: str
    tenant_id: str
    phone: str
    message: str
    status: str  # Sent, Simulated, Failed
    type: str  # Receipt, Invoice, Reminder
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AuditLog(BaseDocument):
    log_id: str
    tenant_id: str
    user_email: str
    action: str
    details: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BillingInvoice(BaseDocument):
    billing_id: str
    tenant_id: str
    package: str
    amount: float
    payment_status: str  # Pending, Success, Expired
    snap_token: Optional[str] = None
    snap_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Auth Helper Functions ---

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_jwt_token(user_id: str, tenant_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user_from_token(token: str) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user_doc)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(
    authorization: Optional[str] = Header(None),
    session_token: Optional[str] = Cookie(None)
) -> User:
    # 1. Check Cookie first (Google Social Login preferred, or JWT fallback)
    if session_token:
        # Check active session document (OAuth)
        session_doc = await db.user_sessions.find_one({"session_token": session_token})
        if session_doc:
            expires_at = session_doc["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
            
            user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
            if user_doc:
                return User(**user_doc)
        
        # Fallback: try decoding session_token directly as a JWT token! (Avoids logout after reload for JWT sessions)
        try:
            return await get_current_user_from_token(session_token)
        except Exception:
            pass

    # 2. Check Authorization Header as fallback
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        return await get_current_user_from_token(token)

    raise HTTPException(status_code=401, detail="Not authenticated")


# --- SEEDING FUNCTION ---
async def seed_default_accounts():
    # 1. Seed Owner Account: muhamad.widiono98@gmail.com
    owner_email = "muhamad.widiono98@gmail.com"
    default_tenant_id = "tenant-default"
    
    tenant_exists = await db.tenants.find_one({"tenant_id": default_tenant_id})
    if not tenant_exists:
        tenant_obj = Tenant(
            tenant_id=default_tenant_id,
            name="Widiono Laundry & Toko",
            type="laundry",
            package="Pro",
            max_transactions_limit=-1,
            transaction_count=0,
            owner_email=owner_email
        )
        await db.tenants.insert_one(to_mongo_dict(tenant_obj))
        logger.info("Default tenant seeded!")

    owner_exists = await db.users.find_one({"email": owner_email})
    if not owner_exists:
        owner_obj = User(
            user_id="user-widiono-owner",
            tenant_id=default_tenant_id,
            email=owner_email,
            name="Muhamad Widiono",
            role="Owner",
            password_hash=hash_password("Password123!"),
            picture="https://images.unsplash.com/photo-1735948055457-8d816fb80a87"
        )
        await db.users.insert_one(to_mongo_dict(owner_obj))
        logger.info("Owner account seeded!")

    # 2. Seed Staff Account for testing
    staff_email = "staff@widiono.com"
    staff_exists = await db.users.find_one({"email": staff_email})
    if not staff_exists:
        staff_obj = User(
            user_id="user-widiono-staff",
            tenant_id=default_tenant_id,
            email=staff_email,
            name="Staff Widiono",
            role="Staff",
            password_hash=hash_password("Password123!"),
            picture="https://images.unsplash.com/photo-1735948055457-8d816fb80a87"
        )
        await db.users.insert_one(to_mongo_dict(staff_obj))
        logger.info("Staff account seeded!")

    # 3. Seed Gratis Tenant Account
    gratis_email = "owner-gratis@test.com"
    gratis_tenant_id = "tenant-gratis"
    gratis_tenant_exists = await db.tenants.find_one({"tenant_id": gratis_tenant_id})
    if not gratis_tenant_exists:
        tenant_obj = Tenant(
            tenant_id=gratis_tenant_id,
            name="Toko Kelontong Gratis",
            type="toko",
            package="Gratis",
            max_transactions_limit=10,
            transaction_count=0,
            owner_email=gratis_email
        )
        await db.tenants.insert_one(to_mongo_dict(tenant_obj))

    gratis_owner_exists = await db.users.find_one({"email": gratis_email})
    if not gratis_owner_exists:
        gratis_owner_obj = User(
            user_id="user-gratis-owner",
            tenant_id=gratis_tenant_id,
            email=gratis_email,
            name="Gratis Owner",
            role="Owner",
            password_hash=hash_password("Password123!"),
            picture="https://images.unsplash.com/photo-1735948055457-8d816fb80a87"
        )
        await db.users.insert_one(to_mongo_dict(gratis_owner_obj))

    # Seed some sample products & customers for Widiono Laundry if empty
    p_count = await db.products.count_documents({"tenant_id": default_tenant_id})
    if p_count == 0:
        products = [
            Product(product_id="prod-1", tenant_id=default_tenant_id, name="Cuci Kering Setrika (Premium)", price=12000.0, stock=100, min_stock=10, unit="kg"),
            Product(product_id="prod-2", tenant_id=default_tenant_id, name="Cuci Selimut", price=25000.0, stock=50, min_stock=5, unit="pcs"),
            Product(product_id="prod-3", tenant_id=default_tenant_id, name="Deterjen Premium Sachet", price=3000.0, stock=3, min_stock=8, unit="pcs"),  # Low stock warning
            Product(product_id="prod-4", tenant_id=default_tenant_id, name="Setrika Saja", price=6000.0, stock=200, min_stock=10, unit="kg")
        ]
        for p in products:
            await db.products.insert_one(to_mongo_dict(p))
            # Initial stock movement
            mutation = StockMovement(
                mutation_id=f"mut-{uuid.uuid4().hex[:12]}",
                tenant_id=default_tenant_id,
                product_id=p.product_id,
                product_name=p.name,
                qty_change=p.stock,
                type="initial",
                notes="Initial seeding stock"
            )
            await db.stock_movements.insert_one(to_mongo_dict(mutation))

    c_count = await db.customers.count_documents({"tenant_id": default_tenant_id})
    if c_count == 0:
        customers = [
            Customer(customer_id="cust-1", tenant_id=default_tenant_id, name="Budi Santoso", phone="081234567890", address="Jl. Sudirman No. 12"),
            Customer(customer_id="cust-2", tenant_id=default_tenant_id, name="Siti Aminah", phone="089876543210", address="Jl. Diponegoro No. 45")
        ]
        for c in customers:
            await db.customers.insert_one(to_mongo_dict(c))

@app.on_event("startup")
async def startup_db_client():
    await seed_default_accounts()

# --- AUTH ROUTERS ---

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    business_name: str
    business_type: str

class LoginRequest(BaseModel):
    email: str
    password: str

@api_router.post("/auth/register")
async def register(req: RegisterRequest):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": req.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    tenant_id = f"tenant-{uuid.uuid4().hex[:12]}"
    user_id = f"user-{uuid.uuid4().hex[:12]}"

    # Create Tenant
    tenant_obj = Tenant(
        tenant_id=tenant_id,
        name=req.business_name,
        type=req.business_type,
        package="Pro",  # Give them Pro as default for demo/enjoyment
        max_transactions_limit=-1,
        owner_email=req.email
    )
    await db.tenants.insert_one(to_mongo_dict(tenant_obj))

    # Create User
    user_obj = User(
        user_id=user_id,
        tenant_id=tenant_id,
        email=req.email,
        name=req.name,
        role="Owner",
        password_hash=hash_password(req.password)
    )
    await db.users.insert_one(to_mongo_dict(user_obj))

    token = create_jwt_token(user_id, tenant_id, req.email, "Owner")
    return {"token": token, "user": user_obj}

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user_doc = await db.users.find_one({"email": req.email})
    if not user_doc or not user_doc.get("password_hash") or not verify_password(req.password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    user_obj = User(**user_doc)
    token = create_jwt_token(user_obj.user_id, user_obj.tenant_id, user_obj.email, user_obj.role)
    return {"token": token, "user": user_obj}

@api_router.get("/auth/me")
async def auth_me(current_user: User = Depends(get_current_user)):
    tenant_doc = await db.tenants.find_one({"tenant_id": current_user.tenant_id}, {"_id": 0})
    tenant = Tenant(**tenant_doc) if tenant_doc else None
    return {
        "user": current_user,
        "tenant": tenant
    }

class GoogleSessionRequest(BaseModel):
    session_id: str

@api_router.post("/auth/google")
async def google_auth_exchange(req: GoogleSessionRequest):
    # CALL Emergent Auth session-data endpoint
    url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
    headers = {"X-Session-ID": req.session_id}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="OAuth session exchange failed")
        
        session_data = response.json()
    except Exception as e:
        logger.error(f"Error calling oauth session data: {e}")
        raise HTTPException(status_code=401, detail=f"OAuth communication failed: {str(e)}")

    email = session_data.get("email")
    name = session_data.get("name", "Google User")
    picture = session_data.get("picture")
    ext_session_token = session_data.get("session_token")

    if not email:
        raise HTTPException(status_code=400, detail="Invalid email from Google")

    # Find or Create user
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        # Create brand new tenant for google user
        tenant_id = f"tenant-{uuid.uuid4().hex[:12]}"
        tenant_obj = Tenant(
            tenant_id=tenant_id,
            name=f"{name.split(' ')[0]}'s Shop",
            type="toko",
            package="Pro",
            max_transactions_limit=-1,
            owner_email=email
        )
        await db.tenants.insert_one(to_mongo_dict(tenant_obj))

        user_id = f"user-{uuid.uuid4().hex[:12]}"
        user_obj = User(
            user_id=user_id,
            tenant_id=tenant_id,
            email=email,
            name=name,
            role="Owner",
            picture=picture
        )
        await db.users.insert_one(to_mongo_dict(user_obj))
    else:
        user_obj = User(**user_doc)
        tenant_id = user_obj.tenant_id

    # Create user session inside our db for cookie authentication matching the session_token
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user_obj.user_id},
        {"$set": {
            "session_token": ext_session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )

    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    return {
        "session_token": ext_session_token,
        "user": user_obj,
        "token": create_jwt_token(user_obj.user_id, tenant_id, email, user_obj.role)
    }

@api_router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    await db.user_sessions.delete_many({"user_id": current_user.user_id})
    return {"message": "Logged out successfully"}


# --- CUSTOMERS MODULE ---

@api_router.get("/customers", response_model=List[Customer])
async def list_customers(current_user: User = Depends(get_current_user)):
    customers_docs = await db.customers.find({"tenant_id": current_user.tenant_id}, {"_id": 0}).to_list(1000)
    return [Customer(**c) for c in customers_docs]

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: Customer, current_user: User = Depends(get_current_user)):
    customer_data.tenant_id = current_user.tenant_id
    customer_data.customer_id = f"cust-{uuid.uuid4().hex[:12]}"
    customer_data.created_at = datetime.now(timezone.utc)
    
    await db.customers.insert_one(to_mongo_dict(customer_data))
    
    # Audit log
    await db.audit_logs.insert_one(to_mongo_dict(AuditLog(
        log_id=f"audit-{uuid.uuid4().hex[:12]}",
        tenant_id=current_user.tenant_id,
        user_email=current_user.email,
        action="Create Customer",
        details=f"Created customer {customer_data.name} ({customer_data.phone})"
    )))
    return customer_data

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, updated_customer: Customer, current_user: User = Depends(get_current_user)):
    existing = await db.customers.find_one({"customer_id": customer_id, "tenant_id": current_user.tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated_customer.tenant_id = current_user.tenant_id
    updated_customer.customer_id = customer_id
    
    await db.customers.replace_one({"customer_id": customer_id, "tenant_id": current_user.tenant_id}, to_mongo_dict(updated_customer))
    return updated_customer

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    res = await db.customers.delete_one({"customer_id": customer_id, "tenant_id": current_user.tenant_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}


# --- PRODUCTS MODULE ---

@api_router.get("/products", response_model=List[Product])
async def list_products(current_user: User = Depends(get_current_user)):
    products_docs = await db.products.find({"tenant_id": current_user.tenant_id}, {"_id": 0}).to_list(1000)
    return [Product(**p) for p in products_docs]

@api_router.post("/products", response_model=Product)
async def create_product(product_data: Product, current_user: User = Depends(get_current_user)):
    product_data.tenant_id = current_user.tenant_id
    product_data.product_id = f"prod-{uuid.uuid4().hex[:12]}"
    product_data.created_at = datetime.now(timezone.utc)
    
    await db.products.insert_one(to_mongo_dict(product_data))
    
    # Stock mutation initial record
    if product_data.stock > 0:
        mutation = StockMovement(
            mutation_id=f"mut-{uuid.uuid4().hex[:12]}",
            tenant_id=current_user.tenant_id,
            product_id=product_data.product_id,
            product_name=product_data.name,
            qty_change=product_data.stock,
            type="initial",
            notes="Initial stock level"
        )
        await db.stock_movements.insert_one(to_mongo_dict(mutation))

    return product_data

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, updated_product: Product, current_user: User = Depends(get_current_user)):
    existing = await db.products.find_one({"product_id": product_id, "tenant_id": current_user.tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Calculate stock adjustment
    stock_diff = updated_product.stock - existing.get("stock", 0)
    if stock_diff != 0:
        mutation = StockMovement(
            mutation_id=f"mut-{uuid.uuid4().hex[:12]}",
            tenant_id=current_user.tenant_id,
            product_id=product_id,
            product_name=updated_product.name,
            qty_change=stock_diff,
            type="adjustment",
            notes="Manual inventory correction"
        )
        await db.stock_movements.insert_one(to_mongo_dict(mutation))

    updated_product.tenant_id = current_user.tenant_id
    updated_product.product_id = product_id
    
    await db.products.replace_one({"product_id": product_id, "tenant_id": current_user.tenant_id}, to_mongo_dict(updated_product))
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    res = await db.products.delete_one({"product_id": product_id, "tenant_id": current_user.tenant_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.get("/products/mutations", response_model=List[StockMovement])
async def list_stock_mutations(current_user: User = Depends(get_current_user)):
    mutations_docs = await db.stock_movements.find({"tenant_id": current_user.tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [StockMovement(**m) for m in mutations_docs]


# --- POS & TRANSACTIONS MODULE ---

class TransactionCreate(BaseModel):
    customer_id: Optional[str] = None
    items: List[TransactionItem]
    discount: float = 0.0
    tax: float = 0.0
    amount_paid: float
    payment_method: str  # Cash, QRIS, Transfer, Kasbon

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(tx_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    # 1. Check Feature Gating & Subscription limits
    tenant_doc = await db.tenants.find_one({"tenant_id": current_user.tenant_id}, {"_id": 0})
    if not tenant_doc:
        raise HTTPException(status_code=404, detail="Tenant details not found")
    tenant = Tenant(**tenant_doc)
    
    if tenant.package == "Gratis" and tenant.transaction_count >= 10:
        raise HTTPException(
            status_code=403, 
            detail="Batas transaksi paket Gratis (10 transaksi/bulan) telah tercapai. Harap upgrade ke paket Pro!"
        )
    elif tenant.package == "Basic" and tenant.transaction_count >= 100:
        raise HTTPException(
            status_code=403, 
            detail="Batas transaksi paket Basic (100 transaksi/bulan) telah tercapai. Harap upgrade ke paket Pro!"
        )

    # 2. Fetch Customer name
    customer_name = "Walk-in Customer"
    customer_phone = None
    if tx_data.customer_id:
        cust = await db.customers.find_one({"customer_id": tx_data.customer_id, "tenant_id": current_user.tenant_id})
        if cust:
            customer_name = cust.get("name")
            customer_phone = cust.get("phone")

    # 3. Calculate financial totals
    subtotal = sum(item.price * item.quantity for item in tx_data.items)
    total = subtotal - tx_data.discount + tx_data.tax
    if total < 0:
        total = 0.0

    payment_status = "Belum Bayar"
    if tx_data.amount_paid >= total:
        payment_status = "Lunas"
    elif tx_data.amount_paid > 0:
        payment_status = "Partial"
    else:
        payment_status = "Kasbon"

    # 4. Generate transaction invoice number INV-YYYYMMDD-XXXX
    date_str = datetime.now().strftime("%Y%m%d")
    today_start = datetime.combine(datetime.now().date(), datetime.min.time())
    tx_count_today = await db.transactions.count_documents({
        "tenant_id": current_user.tenant_id,
        "created_at": {"$gte": today_start}
    })
    invoice_no = f"INV-{date_str}-{str(tx_count_today + 1).zfill(4)}"

    # 5. Inventory deduction & movements (Pro packages get automated stock deduction)
    if tenant.package in ["Pro", "Basic"]:
        for item in tx_data.items:
            prod_doc = await db.products.find_one({"product_id": item.product_id, "tenant_id": current_user.tenant_id})
            if prod_doc:
                prod = Product(**prod_doc)
                new_stock = max(0, prod.stock - item.quantity)
                await db.products.update_one(
                    {"product_id": item.product_id, "tenant_id": current_user.tenant_id},
                    {"$set": {"stock": new_stock}}
                )
                # Mutation Log
                mut = StockMovement(
                    mutation_id=f"mut-{uuid.uuid4().hex[:12]}",
                    tenant_id=current_user.tenant_id,
                    product_id=item.product_id,
                    product_name=item.name,
                    qty_change=-item.quantity,
                    type="sale",
                    notes=f"Penjualan via {invoice_no}"
                )
                await db.stock_movements.insert_one(to_mongo_dict(mut))

    # 6. Save Transaction
    tx_obj = Transaction(
        transaction_id=f"tx-{uuid.uuid4().hex[:12]}",
        tenant_id=current_user.tenant_id,
        invoice_no=invoice_no,
        customer_id=tx_data.customer_id,
        customer_name=customer_name,
        items=tx_data.items,
        subtotal=subtotal,
        discount=tx_data.discount,
        tax=tx_data.tax,
        total=total,
        amount_paid=tx_data.amount_paid,
        payment_status=payment_status,
        payment_method=tx_data.payment_method
    )
    await db.transactions.insert_one(to_mongo_dict(tx_obj))

    # Increment tenant transaction count
    await db.tenants.update_one(
        {"tenant_id": current_user.tenant_id},
        {"$inc": {"transaction_count": 1}}
    )

    # 7. WhatsApp simulation / webhook trigger (Pro features only)
    if tenant.package == "Pro" and customer_phone:
        msg = f"Halo {customer_name}, terima kasih telah bertransaksi di {tenant.name}. Total invoice Anda adalah Rp {total:,.2f} ({payment_status}). No Invoice: {invoice_no}."
        
        # Real/Mock WhatsApp dispatcher
        whatsapp_token = os.environ.get("WHATSAPP_TOKEN")
        phone_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
        
        status = "Simulated"
        if whatsapp_token and phone_id:
            try:
                url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
                headers = {
                    "Authorization": f"Bearer {whatsapp_token}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "messaging_product": "whatsapp",
                    "to": customer_phone,
                    "type": "text",
                    "text": {"body": msg}
                }
                resp = requests.post(url, headers=headers, json=payload, timeout=5)
                if resp.status_code == 200:
                    status = "Sent"
                else:
                    status = "Failed"
            except Exception as e:
                logger.error(f"WhatsApp error: {e}")
                status = "Failed"

        wa_log = WhatsAppLog(
            log_id=f"wa-{uuid.uuid4().hex[:12]}",
            tenant_id=current_user.tenant_id,
            phone=customer_phone,
            message=msg,
            status=status,
            type="Receipt"
        )
        await db.whatsapp_logs.insert_one(to_mongo_dict(wa_log))

    # Audit log
    await db.audit_logs.insert_one(to_mongo_dict(AuditLog(
        log_id=f"audit-{uuid.uuid4().hex[:12]}",
        tenant_id=current_user.tenant_id,
        user_email=current_user.email,
        action="Create Transaction",
        details=f"Created POS order {invoice_no} totaling Rp {total:,.2f}"
    )))

    return tx_obj

@api_router.get("/transactions", response_model=List[Transaction])
async def list_transactions(current_user: User = Depends(get_current_user)):
    tx_docs = await db.transactions.find({"tenant_id": current_user.tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Transaction(**t) for p in tx_docs if (t := p)]

class RecordPaymentRequest(BaseModel):
    amount: float

@api_router.post("/transactions/{transaction_id}/payment", response_model=Transaction)
async def record_transaction_payment(transaction_id: str, payload: RecordPaymentRequest, current_user: User = Depends(get_current_user)):
    tx_doc = await db.transactions.find_one({"transaction_id": transaction_id, "tenant_id": current_user.tenant_id})
    if not tx_doc:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    tx = Transaction(**tx_doc)
    new_amount_paid = tx.amount_paid + payload.amount
    
    payment_status = "Belum Bayar"
    if new_amount_paid >= tx.total:
        payment_status = "Lunas"
    elif new_amount_paid > 0:
        payment_status = "Partial"
    else:
        payment_status = "Kasbon"

    await db.transactions.update_one(
        {"transaction_id": transaction_id, "tenant_id": current_user.tenant_id},
        {"$set": {
            "amount_paid": new_amount_paid,
            "payment_status": payment_status
        }}
    )
    tx.amount_paid = new_amount_paid
    tx.payment_status = payment_status

    # Audit log
    await db.audit_logs.insert_one(to_mongo_dict(AuditLog(
        log_id=f"audit-{uuid.uuid4().hex[:12]}",
        tenant_id=current_user.tenant_id,
        user_email=current_user.email,
        action="Record Payment",
        details=f"Recorded partial payment of Rp {payload.amount:,.2f} on {tx.invoice_no}"
    )))
    return tx


# --- DASHBOARD & SUBSCRIPTION ENDPOINTS ---

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    tenant_id = current_user.tenant_id
    
    total_sales = await db.transactions.count_documents({"tenant_id": tenant_id})
    all_txs = await db.transactions.find({"tenant_id": tenant_id}).to_list(1000)
    
    total_revenue = sum(t.get("amount_paid", 0.0) for t in all_txs)
    total_receivable = sum(max(0, t.get("total", 0.0) - t.get("amount_paid", 0.0)) for t in all_txs)
    
    total_customers = await db.customers.count_documents({"tenant_id": tenant_id})
    
    all_products = await db.products.find({"tenant_id": tenant_id}).to_list(1000)
    low_stock_count = sum(1 for p in all_products if p.get("stock", 0) <= p.get("min_stock", 5))

    sales_by_date = {}
    for t in all_txs:
        dt_val = t.get("created_at")
        if isinstance(dt_val, str):
            dt_val = datetime.fromisoformat(dt_val)
        date_str = dt_val.strftime("%Y-%m-%d")
        sales_by_date[date_str] = sales_by_date.get(date_str, 0.0) + t.get("total", 0.0)

    trend_chart = []
    sorted_dates = sorted(sales_by_date.keys())[-7:]
    for d in sorted_dates:
        trend_chart.append({"date": d, "revenue": sales_by_date[d]})

    if not trend_chart:
        today = datetime.now().strftime("%Y-%m-%d")
        trend_chart = [{"date": today, "revenue": 0.0}]

    prod_sales = {}
    for t in all_txs:
        for item in t.get("items", []):
            name = item.get("name")
            prod_sales[name] = prod_sales.get(name, 0) + item.get("quantity", 0)

    top_products = [{"name": name, "sales": qty} for name, qty in sorted(prod_sales.items(), key=lambda x: x[1], reverse=True)[:5]]

    return {
        "total_revenue": total_revenue,
        "total_sales": total_sales,
        "total_receivable": total_receivable,
        "total_customers": total_customers,
        "low_stock_count": low_stock_count,
        "trend_chart": trend_chart,
        "top_products": top_products
    }

@api_router.get("/dashboard/subscription")
async def get_subscription(current_user: User = Depends(get_current_user)):
    tenant_doc = await db.tenants.find_one({"tenant_id": current_user.tenant_id}, {"_id": 0})
    if not tenant_doc:
        raise HTTPException(status_code=404, detail="Tenant details not found")
    
    tenant = Tenant(**tenant_doc)
    return {
        "package": tenant.package,
        "max_transactions_limit": tenant.max_transactions_limit,
        "transaction_count": tenant.transaction_count,
        "owner_email": tenant.owner_email
    }

class UpgradeRequest(BaseModel):
    package: str  # Basic, Pro

@api_router.post("/dashboard/upgrade")
async def upgrade_subscription(req: UpgradeRequest, current_user: User = Depends(get_current_user)):
    tenant_id = current_user.tenant_id
    
    price_map = {"Basic": 50000.0, "Pro": 150000.0}
    amount = price_map.get(req.package, 0.0)

    billing_id = f"bill-{uuid.uuid4().hex[:12]}"

    midtrans_server_key = os.environ.get("MIDTRANS_SERVER_KEY")
    
    snap_token = f"snap-token-{uuid.uuid4().hex[:16]}"
    snap_url = f"https://app.sandbox.midtrans.com/snap/v3/redirection/{snap_token}"

    if midtrans_server_key:
        try:
            import base64
            auth_str = base64.b64encode(f"{midtrans_server_key}:".encode()).decode()
            url = "https://app.sandbox.midtrans.com/snap/v1/transactions"
            payload = {
                "transaction_details": {
                    "order_id": billing_id,
                    "gross_amount": int(amount)
                },
                "customer_details": {
                    "email": current_user.email,
                    "first_name": current_user.name
                }
            }
            resp = requests.post(url, headers={"Authorization": f"Basic {auth_str}", "Content-Type": "application/json"}, json=payload, timeout=5)
            if resp.status_code == 201:
                snap_token = resp.json().get("token")
                snap_url = resp.json().get("redirect_url")
        except Exception as e:
            logger.error(f"Midtrans connection error: {e}. Fallback to simulated.")

    billing_inv = BillingInvoice(
        billing_id=billing_id,
        tenant_id=tenant_id,
        package=req.package,
        amount=amount,
        payment_status="Pending",
        snap_token=snap_token,
        snap_url=snap_url
    )
    await db.billing_invoices.insert_one(to_mongo_dict(billing_inv))

    return {
        "billing_id": billing_id,
        "package": req.package,
        "amount": amount,
        "snap_token": snap_token,
        "snap_url": snap_url
    }

class MidtransWebhookPayload(BaseModel):
    order_id: str
    transaction_status: str
    fraud_status: Optional[str] = None

@api_router.post("/dashboard/midtrans-callback")
async def midtrans_callback(payload: Dict[str, Any]):
    order_id = payload.get("order_id")
    status = payload.get("transaction_status")
    
    if not order_id:
        return {"status": "ignored", "message": "No order_id found"}

    billing = await db.billing_invoices.find_one({"billing_id": order_id})
    if not billing:
        return {"status": "error", "message": f"Billing {order_id} not found"}

    billing_obj = BillingInvoice(**billing)
    tenant_id = billing_obj.tenant_id

    if status in ["capture", "settlement"]:
        await db.billing_invoices.update_one(
            {"billing_id": order_id},
            {"$set": {"payment_status": "Success"}}
        )
        
        # Upgrade package in Tenant
        limit = -1 if billing_obj.package == "Pro" else 100
        await db.tenants.update_one(
            {"tenant_id": tenant_id},
            {"$set": {
                "package": billing_obj.package,
                "max_transactions_limit": limit,
                "transaction_count": 0  # Reset counter on payment
            }}
        )
        return {"status": "success", "message": "Tenant package updated"}
    
    elif status in ["deny", "expire", "cancel"]:
        await db.billing_invoices.update_one(
            {"billing_id": order_id},
            {"$set": {"payment_status": "Expired"}}
        )
        return {"status": "success", "message": "Invoice marked expired"}

    return {"status": "ignored"}


# --- SIMULATION & SYSTEM LOGS ---

@api_router.get("/whatsapp/logs", response_model=List[WhatsAppLog])
async def list_whatsapp_logs(current_user: User = Depends(get_current_user)):
    wa_docs = await db.whatsapp_logs.find({"tenant_id": current_user.tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [WhatsAppLog(**w) for w in wa_docs]

@api_router.get("/audit-logs", response_model=List[AuditLog])
async def list_audit_logs(current_user: User = Depends(get_current_user)):
    audit_docs = await db.audit_logs.find({"tenant_id": current_user.tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [AuditLog(**a) for a in audit_docs]


# --- SUPER ADMIN DASHBOARD ---

@api_router.get("/superadmin/stats")
async def get_super_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.email != "muhamad.widiono98@gmail.com":
        raise HTTPException(status_code=403, detail="Akses ditolak. Hanya Super Admin / Owner utama yang diizinkan.")
    
    total_tenants = await db.tenants.count_documents({})
    all_tenants = await db.tenants.find({}).to_list(1000)
    
    packages_count = {
        "Gratis": sum(1 for t in all_tenants if t.get("package") == "Gratis"),
        "Basic": sum(1 for t in all_tenants if t.get("package") == "Basic"),
        "Pro": sum(1 for t in all_tenants if t.get("package") == "Pro")
    }
    
    all_users = await db.users.find({}, {"_id": 0}).to_list(1000)
    all_txs = await db.transactions.find({}).to_list(1000)
    all_wa = await db.whatsapp_logs.find({}).to_list(1000)
    
    return {
        "total_tenants": total_tenants,
        "packages_distribution": packages_count,
        "total_users": len(all_users),
        "total_global_transactions": len(all_txs),
        "total_whatsapp_messages": len(all_wa),
        "tenants_list": [Tenant(**t) for t in all_tenants]
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
