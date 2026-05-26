import asyncio
from app.db.database import connect_to_mongo, get_db

async def check():
    await connect_to_mongo()
    db = get_db()
    
    user = await db.users.find_one()
    if user:
        print(f"User ID: {user['_id']} (Type: {type(user['_id'])})")
        print(f"User ID Str Length: {len(str(user['_id']))}")
    
    item = await db.inventory_items.find_one()
    if item:
        print(f"Item userId: {item['userId']} (Type: {type(item['userId'])})")
        print(f"Item userId Length: {len(str(item['userId']))}")

    client = db.client
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
