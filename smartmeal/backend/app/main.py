from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.database import connect_to_mongo, close_mongo_connection
from app.db.init_db import create_indexes
from app.routes.auth import router as auth_router
from app.routes.recipes import router as recipes_router
from app.routes.upload import router as upload_router
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

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(recipes_router, prefix="/api/recipes", tags=["recipes"])
app.include_router(upload_router, prefix="/api/upload", tags=["upload"])

# Serve uploaded images as static files
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Configure CORS
origins = [
    "http://localhost:7001",  # Vite dev server
    "http://localhost:7002",  # Vite dev server alternative
    "http://localhost:8001",  # Alternative dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to SmartMeal API"}
