import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def diagnose():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.smartmeal
    
    print("--- 1. Checking Recipe Categories ---")
    cats = await db.recipes.distinct("category")
    print(f"Categories in DB: {cats}")
    
    valid_cats = ["breakfast", "lunch", "dinner", "snack"]
    invalid = [c for c in cats if c not in valid_cats]
    if invalid:
        print(f"!!! ALERT: Found invalid categories that will crash the API: {invalid}")
    else:
        print("Success: All categories are valid for Enum.")
        
    print("\n--- 2. Checking User existence ---")
    user = await db.users.find_one({"email": "raashidh24@gmail.com"})
    if user:
        print(f"Success: Found user raashidh24@gmail.com with ID {user['_id']}")
    else:
        print("!!! ALERT: User raashidh24@gmail.com NOT FOUND")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(diagnose())
