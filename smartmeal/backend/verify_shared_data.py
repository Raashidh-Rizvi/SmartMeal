"""
Diagnostic script to verify shared data logic across all collections.
All users should see user_id = "1" data.
"""
import asyncio
from app.db.database import connect_to_mongo, close_mongo_connection, get_db

async def check_all_collections():
    await connect_to_mongo()
    db = get_db()
    
    print("\n" + "="*80)
    print("SMART MEAL PLANNER - SHARED DATA DIAGNOSTIC")
    print("="*80)
    
    # Collection names to check
    collections = [
        "users",
        "recipes", 
        "meal_schedules",
        "inventory_items",
        "shopping_items",
        "budgets",
        "leftovers",
        "notifications"
    ]
    
    for coll_name in collections:
        print(f"\n📋 Collection: {coll_name}")
        print("-" * 80)
        
        try:
            collection = db[coll_name]
            total_docs = await collection.count_documents({})
            
            # Count docs for user "1"
            user_1_docs = await collection.count_documents({"user_id": "1"})
            user_1_userId = await collection.count_documents({"userId": "1"})
            
            print(f"   Total documents: {total_docs}")
            print(f"   Documents for user_id='1': {user_1_docs}")
            print(f"   Documents for userId='1': {user_1_userId}")
            
            # Show sample docs
            sample = await collection.find_one({})
            if sample:
                print(f"   ✓ Sample document keys: {list(sample.keys())}")
            else:
                print(f"   ⚠️ No documents in collection")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "="*80)
    print("KEY USERS")
    print("="*80)
    
    # Check users collection
    all_users = await db.users.find({}).to_list(length=100)
    print(f"\nTotal users: {len(all_users)}")
    for user in all_users:
        print(f"  - {user.get('email', 'N/A')} (ID: {user.get('_id')})")
    
    print("\n" + "="*80)
    print("SHARED DATA STATUS")
    print("="*80)
    
    # Verify shared user "1" data
    meals_count = await db.meal_schedules.count_documents({"user_id": "1"})
    inventory_count = await db.inventory_items.count_documents({"userId": "1"})
    shopping_count = await db.shopping_items.count_documents({"user_id": "1"})
    budget_count = await db.budgets.count_documents({"user_id": "1"})
    leftovers_count = await db.leftovers.count_documents({"user_id": "1"})
    
    print(f"\n✓ Shared User '1' Data:")
    print(f"   Meals:         {meals_count}")
    print(f"   Inventory:     {inventory_count}")
    print(f"   Shopping List: {shopping_count}")
    print(f"   Budgets:       {budget_count}")
    print(f"   Leftovers:     {leftovers_count}")
    print(f"   Total:         {meals_count + inventory_count + shopping_count + budget_count + leftovers_count}")
    
    print("\n" + "="*80)
    print("✅ DIAGNOSTIC COMPLETE")
    print("="*80 + "\n")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_all_collections())
