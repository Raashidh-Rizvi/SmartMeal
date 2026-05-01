import asyncio
from app.db.database import connect_to_mongo, get_db

async def check():
    await connect_to_mongo()
    db = get_db()
    
    users = await db.users.find().to_list(None)
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"User ID: {u['_id']} | Email: {u['email']}")
    
    inventory_count = await db.inventory_items.count_documents({})
    print(f"Total Inventory Items: {inventory_count}")
    
    # Check one item again
    item = await db.inventory_items.find_one()
    if item:
        print(f"Sample Inventory Item userId: {item['userId']}")
    
    client = db.client
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
