import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId

async def check_db():
    client = AsyncIOMotorClient("mongodb+srv://it24104191_db_user:ni9VSml0UlLTOIOZ@smartmeal.w9v8bau.mongodb.net/?retryWrites=true&w=majority")
    db = client.smartmeal
    
    meals_count = await db.meal_schedules.count_documents({})
    recipes_count = await db.recipes.count_documents({})
    ratings_count = await db.meal_schedules.count_documents({"rating": {"$exists": True, "$ne": None}})
    
    print(f"Total Meals: {meals_count}")
    print(f"Total Recipes: {recipes_count}")
    print(f"Meals with Ratings: {ratings_count}")
    
    if ratings_count > 0:
        print("\nRated Meals:")
        cursor = db.meal_schedules.find({"rating": {"$exists": True, "$ne": None}})
        async for m in cursor:
            rid = m.get('recipe_id')
            recipe = await db.recipes.find_one({"_id": ObjectId(rid)}) if rid else None
            print(f"- Recipe ID: {rid}, Found: {bool(recipe)}, Rating: {m.get('rating')}")
            if recipe:
                print(f"  Title: {recipe.get('title')}")

if __name__ == "__main__":
    asyncio.run(check_db())
