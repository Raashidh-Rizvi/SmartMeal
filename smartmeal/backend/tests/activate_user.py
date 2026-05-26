import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def fix_user():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    email = "raashidhrizvi03@gmail.com"
    result = await db["users"].update_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}},
        {"$set": {"is_active": True}}
    )
    if result.modified_count > 0:
        print(f"Successfully activated user: {email}")
    else:
        print(f"User {email} was already active or not found")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_user())
