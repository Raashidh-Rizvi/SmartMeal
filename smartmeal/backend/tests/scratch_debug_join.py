import asyncio
from app.db.database import connect_to_mongo, get_db
from bson import ObjectId

async def check():
    await connect_to_mongo()
    db = get_db()
    
    item = await db.inventory_items.find_one()
    user_id_str = item['userId']
    print(f"Item userId: {user_id_str} (Length: {len(user_id_str)})")
    
    # Try finding user with exactly this ID (if it was stored as string)
    user = await db.users.find_one({"_id": user_id_str})
    print(f"User found with string ID: {user['email'] if user else 'None'}")
    
    # Try finding user with 24-char ObjectId variants
    if len(user_id_str) == 25:
        variant1 = user_id_str[:24]
        variant2 = user_id_str[1:]
        print(f"Variant 1 ([:24]): {variant1}")
        print(f"Variant 2 ([1:]): {variant2}")
        
        u1 = await db.users.find_one({"_id": ObjectId(variant1)}) if len(variant1) == 24 else None
        u2 = await db.users.find_one({"_id": ObjectId(variant2)}) if len(variant2) == 24 else None
        
        print(f"User 1: {u1['email'] if u1 else 'None'}")
        print(f"User 2: {u2['email'] if u2 else 'None'}")

    client = db.client
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
