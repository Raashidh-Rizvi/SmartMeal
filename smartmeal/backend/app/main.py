from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

# Serve uploaded images as static files
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# CORS must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:7001",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:7002",
        "http://localhost:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(inventory_router, prefix="/api/inventory", tags=["user-inventory"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(admin_ingredient_router, prefix="/api/admin", tags=["admin-ingredients"])
app.include_router(shopping_router, prefix="/api", tags=["shopping"])
app.include_router(recipes_router, prefix="/api/recipes", tags=["recipes"])
app.include_router(upload_router, prefix="/api/upload", tags=["upload"])
app.include_router(meal_schedule_router, prefix="/api/meal-schedules", tags=["meal-schedules"])

@app.get("/")
async def root():
    return {"message": "Welcome to SmartMeal API"}
