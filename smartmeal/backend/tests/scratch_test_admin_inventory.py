import asyncio
import json
from app.db.database import connect_to_mongo, get_db
from app.routes.admin_routes import admin_inventory

async def test_admin_inventory():
    await connect_to_mongo()
    
    print("Testing admin_inventory with default params...")
    res = await admin_inventory(page=1, limit=5)
    print(f"Total: {res['total']}")
    print(f"Items Count: {len(res['items'])}")
    if res['items']:
        print(f"Sample Item Email: {res['items'][0].get('userEmail')}")
    
    print("\nTesting admin_inventory with email filter...")
    res_email = await admin_inventory(page=1, limit=5, userEmail="raashidh")
    print(f"Total with 'raashidh': {res_email['total']}")
    
    print("\nTesting admin_inventory items with joined email...")
    for item in res['items']:
        print(f"Item: {item['name']} | Email: {item.get('userEmail')}")

    client = get_db().client
    client.close()

if __name__ == "__main__":
    asyncio.run(test_admin_inventory())
