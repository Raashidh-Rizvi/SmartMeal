import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add the parent directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

async def migrate():
    print("Starting migration: created_at -> createdAt")
    uri = settings.MONGODB_URI.strip()
    client = AsyncIOMotorClient(uri)
    db = client[settings.MONGODB_DB_NAME]
    
    # Find all users with created_at
    cursor = db.users.find({"created_at": {"$exists": True}})
    users = await cursor.to_list(length=None)
    
    print(f"Found {len(users)} users to migrate.")
    
    for user in users:
        user_id = user["_id"]
        created_at = user["created_at"]
        
        # Update user: set createdAt, unset created_at
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {"createdAt": created_at},
                "$unset": {"created_at": ""}
            }
        )
        print(f"Migrated user: {user.get('email', str(user_id))}")
        
    print("Migration completed.")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate())
