import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId

async def check_db():
    client = AsyncIOMotorClient("mongodb+srv://it24104191_db_user:ni9VSml0UlLTOIOZ@smartmeal.w9v8bau.mongodb.net/?retryWrites=true&w=majority")
    db = client.smartmeal
    
    # 3. Highly Rated (Most Recommended) Recipes
    pipeline_rated = [
        {"$match": {"rating": {"$exists": True, "$ne": None}}},
        {"$group": {
            "_id": "$recipe_id", 
            "avgRating": {"$avg": "$rating"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"avgRating": -1, "count": -1}},
        {"$limit": 5}
    ]
    cursor = db.meal_schedules.aggregate(pipeline_rated)
    results = await cursor.to_list(length=None)
    print("\nAggregation Results:")
    for res in results:
        print(f"- ID: {res['_id']}, AvgRating: {res['avgRating']}, Count: {res['count']}")
        rid = res["_id"]
        try:
            recipe = await db.recipes.find_one({"_id": ObjectId(rid)}) if rid else None
            m = await db.meal_schedules.find_one({})
            print(f"Type of recipe_id in DB: {type(m.get('recipe_id'))}")
            print(f"  Title: {recipe.get('title') if recipe else 'Unknown'}")
        except Exception as e:
            print(f"  Error fetching recipe: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
