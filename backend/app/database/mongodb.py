from __future__ import annotations
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
db = Database()

async def get_database():
    return db.client.smart_meal_db

async def connect_to_mongo():
    db.client = AsyncIOMotorClient("mongodb://localhost:27017")
    print("Connected to MongoDB")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")
