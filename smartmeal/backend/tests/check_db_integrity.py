import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db_integrity():
    # Use the same default connection if not specified
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.smartmeal
    
    print("--- Database Integrity Check ---")
    
    # 1. Check Recipe Categories
    print("\nChecking Recipe Categories...")
    cats = await db.recipes.distinct("category")
    print(f"Distinct categories found: {cats}")
    
    valid_cats = ["breakfast", "lunch", "dinner", "snack"]
    invalid_recipes = await db.recipes.find({"category": {"$nin": valid_cats}}).to_list(length=10)
    
    if invalid_recipes:
        print(f"ERROR: Found {len(invalid_recipes)} recipes with invalid categories!")
        for r in invalid_recipes:
            print(f" - Title: {r.get('title')}, Category: {r.get('category')}")
    else:
        print("SUCCESS: All recipe categories match the Enum.")
        
    # 2. Check Target User
    print("\nChecking Target User...")
    email = "raashidh24@gmail.com"
    user = await db.users.find_one({"email": email})
    if user:
        print(f"SUCCESS: User {email} found with ID: {user['_id']}")
    else:
        print(f"ERROR: User {email} NOT FOUND in 'users' collection.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db_integrity())
