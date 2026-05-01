import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def check_user():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    # Check all users
    cursor = db["users"].find({})
    async for user in cursor:
        print(f"User: {user.get('email')}, is_active: {user.get('is_active', 'Missing (default True)')}, role: {user.get('role')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_user())
