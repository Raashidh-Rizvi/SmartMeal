import asyncio
from app.db.database import connect_to_mongo, get_db

async def check():
    await connect_to_mongo()
    db = get_db()
    
    # Check one inventory item
    item = await db.inventory_items.find_one()
    print(f"Sample Item: {item}")
    
    # Check if we have user email in inventory items or need join
    # Usually we don't store email in every item, we store userId
    
    # Check admin user
    admin = await db.users.find_one({"role": "ADMIN"})
    print(f"Admin: {admin['email'] if admin else 'None'}")
    
    client = db.client
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
