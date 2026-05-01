import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def check_user():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    email = "raashidhrizvi03@gmail.com"
    user = await db["users"].find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
    if user:
        print(f"Found user: {user.get('email')}, is_active: {user.get('is_active')}")
    else:
        print(f"User {email} not found")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_user())
