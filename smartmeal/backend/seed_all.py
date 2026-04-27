import asyncio
import bcrypt
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import sys

from app.db.database import connect_to_mongo, close_mongo_connection, get_db

async def seed_data():
    await connect_to_mongo()
    db = get_db()
    
    # Drop all 9 collections
    print("Dropping existing collections...")
    collections_to_drop = [
        "users", "recipes", "ingredients", "inventory_items", 
        "leftovers", "shopping_items", "meal_schedules", 
        "budgets", "expenses"
    ]
    for coll in collections_to_drop:
        await db[coll].drop()

    now = datetime.now(timezone.utc)
    
    # EXACT 24-char ID
    target_user_id = "69cb80e6ad637466cf07999a"
    guest_user_id = "000000000000000000000001"
    
    print(f"Seeding Users: target={target_user_id}")
    hashed_password = bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode()
    
    # 1. Create the specific user using STRING ID (no ObjectId wrap)
    await db.users.insert_one({
        "_id": target_user_id,
        "name": "Raashidh Rizvi",
        "email": "raashidh24@gmail.com",
        "password_hash": hashed_password,
        "role": "ADMIN",
        "is_active": True,
        "createdAt": now,
        "updatedAt": now
    })
    
    # 2. Create the Guest user
    await db.users.insert_one({
        "_id": guest_user_id,
        "name": "Guest User",
        "email": "guest@example.com",
        "password_hash": hashed_password, # Adding a password for consistency
        "role": "USER",
        "is_active": True,
        "createdAt": now,
        "updatedAt": now
    })
        
    all_user_ids = [target_user_id, guest_user_id]

    # NOTE: Recipe seeding disabled - users should create recipes manually
    # If you want to restore seeding later, uncomment the section below:
    # print("Seeding Recipes...")
    # recipe_names = ["Pasta", "Taco", "Salad", "Soup", "Pizza", "Stir Fry", "Risotto", "Burger", "Curry", "Sushi"]
    # categories = ["breakfast", "lunch", "dinner", "snack"]
    # recipe_ids = []
    # for i in range(10):
    #     res = await db.recipes.insert_one({...})
    #     recipe_ids.append(str(res.inserted_id))
    
    recipe_ids = []  # Empty list for any downstream reference

    print("Seeding Inventory...")
    inventory_items = ["Milk", "Eggs", "Bread", "Butter", "Cheese", "Apples", "Chicken", "Rice", "Tomato", "Onion"]
    for i in range(10):
        await db.inventory_items.insert_one({
            "userId": target_user_id,
            "name": inventory_items[i],
            "category": "Produce" if i > 5 else "Dairy",
            "quantity": float(i + 1),
            "unit": "unit",
            "expiryDate": now + timedelta(days=5),
            "createdAt": now
        })

    print("Seeding Shopping List...")
    shopping_items = ["Coffee", "Sugar", "Tea", "Salt", "Pepper", "Oil", "Water", "Juice", "Bread", "Eggs"]
    for i in range(10):
        await db.shopping_items.insert_one({
            "user_id": target_user_id,
            "name": shopping_items[i],
            "quantity": 1.0,
            "unit": "item",
            "category": "Pantry",
            "status": "pending",
            "created_at": now
        })

    print("Seeding Leftovers...")
    leftovers = ["Pizza Slice", "Chicken Wing", "Fried Rice Bowl", "Pasta Plate", "Soup cup"]
    for i in range(len(leftovers)):
        await db.leftovers.insert_one({
            "user_id": target_user_id,
            "name": leftovers[i],
            "quantity": "1 serving",
            "category": "Dinner",
            "cooked_date": now,
            "expiry_date": now + timedelta(days=2),
            "storage_location": "fridge",
            "is_used": False,
            "created_at": now
        })

    print(f"\nSUCCESS: Data seeded for user {target_user_id} (raashidh24@gmail.com).")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_data())
