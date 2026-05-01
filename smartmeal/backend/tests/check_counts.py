import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    total = await db["recipes"].count_documents({})
    users = await db["users"].count_documents({})
    
    print(f"Total recipes: {total}")
    print(f"Total users: {users}")
    
    # Check one user's favorites
    user = await db["users"].find_one({})
    if user:
        favs = user.get("favoriteRecipes", [])
        print(f"User {user.get('email')} has {len(favs)} favorites")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
