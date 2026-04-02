import asyncio
import json
from app.db.database import connect_to_mongo, get_db

async def check_db():
    await connect_to_mongo()
    db = get_db()
    
    # Check recipe categories
    cats = await db.recipes.distinct("category")
    print(f"Recipe Categories in DB: {cats}")
    
    # Check if any recipe has a category not in our Enum
    valid_cats = ["breakfast", "lunch", "dinner", "snack"]
    invalid_recipes = await db.recipes.count_documents({"category": {"$nin": valid_cats}})
    print(f"Recipes with invalid categories: {invalid_recipes}")
    
    # Check target user
    user = await db.users.find_one({"email": "raashidh24@gmail.com"})
    if user:
        print(f"Target User Found: {user.get('email')} with ID {user['_id']}")
    else:
        print("Target User NOT FOUND")
        
    await db.client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
