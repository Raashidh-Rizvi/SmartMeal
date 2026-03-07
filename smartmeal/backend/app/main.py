from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import connect_to_mongo, close_mongo_connection
from app.db.init_db import create_indexes
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.admin_routes import router as admin_router
from app.routes.admin_ingredient_routes import router as admin_ingredient_router
from app.routes.inventory_routes import router as inventory_router

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

# CORS must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:7001",
        "http://localhost:3000",
        "http://localhost:5173",
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

@app.get("/")
async def root():
    return {"message": "Welcome to SmartMeal API"}
