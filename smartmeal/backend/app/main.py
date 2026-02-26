from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import connect_to_mongo, close_mongo_connection
from app.db.init_db import create_indexes
import logging

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
from app.routes.auth import router as auth_router

app = FastAPI(title="SmartMeal API", lifespan=lifespan)

app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Configure CORS
origins = [
    "http://localhost:7001",  # Vite dev server
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
