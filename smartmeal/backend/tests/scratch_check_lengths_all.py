import asyncio
from app.db.database import connect_to_mongo, get_db

async def check():
    await connect_to_mongo()
    db = get_db()
    
    items = await db.inventory_items.find().to_list(None)
    for i in items:
        uid = i.get('userId')
        length = len(str(uid)) if uid else 0
        if length == 24:
            print(f"Item {i['_id']} has 24-char userId: {uid}")
    
    client = db.client
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
