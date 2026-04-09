from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.db.database import connect_to_mongo, close_mongo_connection
from app.db.init_db import create_indexes
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.admin_routes import router as admin_router
from app.routes.admin_ingredient_routes import router as admin_ingredient_router
from app.routes.inventory_routes import router as inventory_router
from app.routes.shopping_routes import router as shopping_router
from app.routes.recipes import router as recipes_router
from app.routes.upload import router as upload_router
from app.routes.meal_schedule_routes import router as meal_schedule_router
from app.routes.leftovers import router as leftovers_router
from app.routes.budget import router as budget_router
from app.routes.leftover_ai_routes import router as leftover_ai_router
from app.routes.notification_routes import router as notification_router
from app.routes.recommendation_routes import router as recommendation_router
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    await create_indexes()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(title="SmartMeal API", lifespan=lifespan)

# ── CORS Exception Handler (Ensures headers on 422/etc) ────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    headers = {
        "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
        "Access-Control-Allow-Credentials": "true",
    }
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers=headers
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    headers = {
        "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
        "Access-Control-Allow-Credentials": "true",
    }
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error"},
        headers=headers
    )

# ── CORS Configuration (MUST be added FIRST before routes/mounts) ──────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:7001",
        "http://localhost:7002",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:7001",
        "http://127.0.0.1:7002",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images as static files
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(inventory_router, prefix="/api/inventory", tags=["user-inventory"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(admin_ingredient_router, prefix="/api/admin", tags=["admin-ingredients"])
app.include_router(shopping_router, prefix="/api", tags=["shopping"])
app.include_router(recipes_router, prefix="/api/recipes", tags=["recipes"])
app.include_router(upload_router, prefix="/api/upload", tags=["upload"])
app.include_router(meal_schedule_router, prefix="/api/meal-schedules", tags=["meal-schedules"])
app.include_router(leftovers_router)
app.include_router(budget_router)
app.include_router(leftover_ai_router)
app.include_router(notification_router, prefix="/api", tags=["notifications"])
app.include_router(recommendation_router)

@app.get("/")
async def root():
    return {"message": "Welcome to SmartMeal API"}
