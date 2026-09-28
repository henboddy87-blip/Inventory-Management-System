from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine
# Import all models so Base metadata has all table definitions
import app.models  # noqa: F401

# Import API routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.categories import router as categories_router
from app.api.warehouses import router as warehouses_router
from app.api.products import router as products_router
from app.api.partners import router as partners_router
from app.api.inventory import router as inventory_router
from app.api.purchases import router as purchases_router
from app.api.sales import router as sales_router
from app.api.finance import router as finance_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.system import router as system_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema tables exist
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Full-stack Inventory Management System for Cambodian SMEs supporting English & Khmer, USD/KHR dual currency, and KHQR.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for user-friendly error messages (Never expose raw stack traces)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        print(f"[ERROR] {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact system support."}
    )

# Health check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "currency_default": settings.DEFAULT_CURRENCY,
        "exchange_rate_khr": settings.EXCHANGE_RATE_KHR
    }

# Register all API routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(warehouses_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(partners_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(purchases_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(finance_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(system_router, prefix="/api")
