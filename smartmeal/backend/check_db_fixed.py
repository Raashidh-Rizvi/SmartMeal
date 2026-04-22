import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    # Manual connection to avoid app import issues if it's broken
    mongo_uri = "mongodb://localhost:27017" # Default for this project
    client = AsyncIOMotorClient(mongo_uri)
    db = client.smartmeal
    
    try:
        # Check recipe categories
        cats = await db.recipes.distinct("category")
        print(f"Recipe Categories in DB: {cats}")
        
        # Check if any recipe has a category not in our Enum (breakfast, lunch, dinner, snack)
        valid_cats = ["breakfast", "lunch", "dinner", "snack"]
        invalid_count = await db.recipes.count_documents({"category": {"$nin": valid_cats}})
        print(f"Recipes with categories NOT in ['breakfast', 'lunch', 'dinner', 'snack']: {invalid_count}")
        
        if invalid_count > 0:
            sample = await db.recipes.find_one({"category": {"$nin": valid_cats}})
            print(f"Sample invalid recipe: {sample.get('title')} -> category: {sample.get('category')}")
            
        # Check target user
        user = await db.users.find_one({"email": "raashidh24@gmail.com"})
        if user:
            print(f"Target User Found: {user.get('email')} with ID {user['_id']}")
        else:
            print("Target User 'raashidh24@gmail.com' NOT FOUND")
            
        # Check inventory items
        inv_count = await db.inventory_items.count_documents({})
        print(f"Total inventory items: {inv_count}")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
