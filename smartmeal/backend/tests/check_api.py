import asyncio
import os
import sys

sys.path.append(os.path.abspath('e:/Y2S2/SmartMeal/smartmeal/backend'))
from app.db.database import get_db, connect_to_mongo
from app.routes.shopping_routes import get_items

async def main():
    await connect_to_mongo()
    manual_items = await get_items(user_id="1", status_filter="", source_filter="manual")
    print("MANUAL ITEMS:")
    for i in manual_items:
        print(f"ID: {i.get('_id') or i.get('id')}, {i.get('name')}")

    meal_plan_items = await get_items(user_id="1", status_filter="", source_filter="meal-plan")
    print("MEAL PLAN ITEMS:")
    for i in meal_plan_items:
        print(f"ID: {i.get('_id') or i.get('id')}, {i.get('name')}")
        
    all_items = await get_items(user_id="1", status_filter="", source_filter="")
    print("ALL ITEMS:")
    for i in all_items:
        print(f"ID: {i.get('_id') or i.get('id')}, {i.get('name')}")

asyncio.run(main())
