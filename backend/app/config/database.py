import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

# Load variables from backend/.env when present
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URL") or "mongodb://localhost:27017"
DB_NAME = os.getenv("DB_NAME") or "smart_meal_planner"

# Fail fast if Mongo isn't reachable (helps catch "not storing" issues)
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    client.admin.command("ping")
except Exception as e:
    raise RuntimeError(
        "MongoDB connection failed. Check backend/.env MONGO_URI and that MongoDB is running."
    ) from e

db = client[DB_NAME]