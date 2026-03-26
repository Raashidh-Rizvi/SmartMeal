import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv

# Load variables from backend/.env when present
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URL") or "mongodb://localhost:27017"
DB_NAME = os.getenv("DB_NAME") or "smart_meal_planner"

# Async client
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Test connection
async def test_connection():
    try:
        await client.admin.command("ping")
        print("MongoDB connected successfully")
    except Exception as e:
        raise RuntimeError(f"MongoDB connection failed: {e}")