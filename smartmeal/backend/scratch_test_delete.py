import asyncio
from app.db.database import connect_to_mongo, get_db
from app.routes.admin_routes import admin_inventory, delete_inventory_item

async def test_delete():
    await connect_to_mongo()
    
    # Get an item
    res = await admin_inventory(page=1, limit=1)
    if not res['items']:
        print("No items to delete")
        return
    
    item_id = res['items'][0]['_id']
    print(f"Deleting item: {item_id}")
    
    del_res = await delete_inventory_item(item_id)
    print(f"Delete response: {del_res}")
    
    # Check if gone
    res_after = await admin_inventory(page=1, limit=1)
    new_ids = [i['_id'] for i in res_after['items']]
    if item_id not in new_ids:
        print("Success: Item deleted")
    else:
        print("Failure: Item still exists")

    client = get_db().client
    client.close()

if __name__ == "__main__":
    asyncio.run(test_delete())
