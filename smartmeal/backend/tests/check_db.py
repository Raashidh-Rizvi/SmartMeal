import asyncio
import os
import sys

sys.path.append(os.path.abspath('e:/Y2S2/SmartMeal/smartmeal/backend'))
from app.db.database import get_db, connect_to_mongo

async def main():
    await connect_to_mongo()
    db = get_db()
    items = await db.shopping_items.find({}).to_list(None)
    for i in items:
        print(f"ID: {i['_id']}, Name: {i.get('name')}, Source: {i.get('source')}, Sources: {i.get('sources')}")

asyncio.run(main())
