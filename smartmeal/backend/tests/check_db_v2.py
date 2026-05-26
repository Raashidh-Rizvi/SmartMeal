import asyncio
from app.db.database import connect_to_mongo, close_mongo_connection, get_db

async def check():
    await connect_to_mongo()
    db = get_db()
    for coll in ["inventory_items", "shopping_items", "leftovers"]:
        total = await db[coll].count_documents({})
        u1 = await db[coll].count_documents({"userId" if coll == "inventory_items" else "user_id": "1"})
        print(f"{coll}: total={total}, user1={u1}")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
