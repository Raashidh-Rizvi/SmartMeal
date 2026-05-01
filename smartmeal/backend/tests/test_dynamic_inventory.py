# -*- coding: utf-8 -*-
"""
Test: Dynamic Inventory Consumption on Meal Creation
"""
import requests, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = "http://localhost:8001"
results = []

def check(label, condition, actual=None):
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {label}")
    if not condition and actual is not None:
        print(f"         Got: {actual}")
    results.append(condition)

def section(title):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")

def cleanup(inv_ids, recipe_ids, meal_ids):
    for i in inv_ids:   requests.delete(f"{BASE}/api/inventory/{i}")
    for r in recipe_ids: requests.delete(f"{BASE}/api/recipes/{r}")
    for m in meal_ids:  requests.delete(f"{BASE}/api/meal-schedules/{m}")
    # clean shopping items created by meals
    items = requests.get(f"{BASE}/api/shopping/all?user_id=1").json()
    for s in items:
        if s.get("category") == "meal-ingredient":
            requests.delete(f"{BASE}/api/shopping/delete/{s['_id']}")

inv_ids, recipe_ids, meal_ids = [], [], []

# Pre-cleanup: remove any leftover test items from previous runs
pre_items = requests.get(f"{BASE}/api/inventory/").json().get("items", [])
for item in pre_items:
    if item["name"] in ["Milk", "Chicken"]:
        requests.delete(f"{BASE}/api/inventory/{item['_id']}")
pre_shop = requests.get(f"{BASE}/api/shopping/all?user_id=1").json()
for s in pre_shop:
    if s.get("category") == "meal-ingredient":
        requests.delete(f"{BASE}/api/shopping/delete/{s['_id']}")

# ============================================================
# TEST 1: Milk 10L, Meal1 needs 10L -> inventory=0, missing=0
#         Meal2 needs 11L -> inventory=0, missing=11L -> auto shopping
# ============================================================
section("TEST 1: Sequential meals consume inventory correctly")

# Add Milk 10L
r = requests.post(f"{BASE}/api/inventory", json={"name":"Milk","quantity":10,"unit":"L","category":"Dairy"})
check("Add Milk 10L to inventory", r.status_code == 200, r.status_code)
inv = r.json(); inv_ids.append(inv["_id"])
check("Milk quantity=10", inv["quantity"] == 10, inv["quantity"])

# Create recipe needing 10L Milk
r = requests.post(f"{BASE}/api/recipes", json={
    "title":"Milk Meal 1","category":"breakfast",
    "ingredients":[{"name":"Milk","quantity":10,"unit":"L"}],
    "preparation_steps":["Pour milk"],"dietary_tags":[]
})
check("Create recipe 10L Milk", r.status_code == 200, r.status_code)
recipe1 = r.json(); recipe_ids.append(recipe1["_id"])

# Create Meal 1 -> should deduct 10L from inventory
r = requests.post(f"{BASE}/api/meal-schedules/", json={
    "user_id":"1","recipe_id":recipe1["_id"],
    "meal_date":"2026-07-01","meal_type":"breakfast",
    "status":"planned","servings":1
})
check("Create Meal 1 (needs 10L)", r.status_code == 200, r.status_code)
meal1 = r.json(); meal_ids.append(meal1["_id"])
check("Meal 1: no warnings (10L available)", len(meal1.get("warnings",[])) == 0, meal1.get("warnings"))

# Check inventory is now 0
r = requests.get(f"{BASE}/api/inventory/")
inv_items = r.json()["items"]
milk = next((i for i in inv_items if i["name"] == "Milk"), None)
check("Inventory Milk=0 after Meal 1", milk is not None and milk["quantity"] == 0, milk)

# Create recipe needing 11L Milk
r = requests.post(f"{BASE}/api/recipes", json={
    "title":"Milk Meal 2","category":"lunch",
    "ingredients":[{"name":"Milk","quantity":11,"unit":"L"}],
    "preparation_steps":["Pour milk"],"dietary_tags":[]
})
check("Create recipe 11L Milk", r.status_code == 200, r.status_code)
recipe2 = r.json(); recipe_ids.append(recipe2["_id"])

# Create Meal 2 -> inventory=0, missing=11L -> auto-added to shopping
r = requests.post(f"{BASE}/api/meal-schedules/", json={
    "user_id":"1","recipe_id":recipe2["_id"],
    "meal_date":"2026-07-01","meal_type":"lunch",
    "status":"planned","servings":1
})
check("Create Meal 2 (needs 11L, inventory=0)", r.status_code == 200, r.status_code)
meal2 = r.json(); meal_ids.append(meal2["_id"])
check("Meal 2: warning shown (0L < 11L)", len(meal2.get("warnings",[])) > 0, meal2.get("warnings"))

# Check shopping list has Milk 11L auto-added
r = requests.get(f"{BASE}/api/shopping/all?user_id=1")
shop_items = r.json()
milk_shop = next((s for s in shop_items if s["name"] == "Milk" and s.get("meal_id") == meal2["_id"]), None)
check("Milk 11L auto-added to shopping list", milk_shop is not None, [s["name"] for s in shop_items])
check("Shopping quantity=11 (full missing)", milk_shop and milk_shop["quantity"] == 11, milk_shop)
check("Shopping unit=L", milk_shop and milk_shop["unit"] == "L", milk_shop)
check("Shopping status=pending", milk_shop and milk_shop["status"] == "pending", milk_shop)

print("  INFO: Milk 10L -> Meal1 uses 10L -> inventory=0 -> Meal2 needs 11L -> auto-added 11L to shopping")

# ============================================================
# TEST 2: Partial consumption — Chicken 10kg, Meal needs 3kg
# inventory should become 7kg, no missing
# ============================================================
section("TEST 2: Partial consumption — Chicken 10kg, Meal needs 3kg")

r = requests.post(f"{BASE}/api/inventory", json={"name":"Chicken","quantity":10,"unit":"kg","category":"Meat"})
check("Add Chicken 10kg", r.status_code == 200, r.status_code)
inv2 = r.json(); inv_ids.append(inv2["_id"])

r = requests.post(f"{BASE}/api/recipes", json={
    "title":"Chicken Dish","category":"dinner",
    "ingredients":[{"name":"Chicken","quantity":3,"unit":"kg"}],
    "preparation_steps":["Cook"],"dietary_tags":[]
})
check("Create recipe 3kg Chicken", r.status_code == 200, r.status_code)
recipe3 = r.json(); recipe_ids.append(recipe3["_id"])

r = requests.post(f"{BASE}/api/meal-schedules/", json={
    "user_id":"1","recipe_id":recipe3["_id"],
    "meal_date":"2026-07-02","meal_type":"dinner",
    "status":"planned","servings":1
})
check("Create Meal (needs 3kg)", r.status_code == 200, r.status_code)
meal3 = r.json(); meal_ids.append(meal3["_id"])
check("No warnings (10kg >= 3kg)", len(meal3.get("warnings",[])) == 0, meal3.get("warnings"))

r = requests.get(f"{BASE}/api/inventory/")
inv_items2 = r.json()["items"]
chicken = next((i for i in inv_items2 if i["name"] == "Chicken"), None)
check("Inventory Chicken=7kg after meal", chicken and chicken["quantity"] == 7, chicken)
print("  INFO: Chicken 10kg - 3kg used = 7kg remaining (correct)")

# ============================================================
# TEST 3: Ingredients endpoint reflects updated inventory
# ============================================================
section("TEST 3: /ingredients endpoint shows correct values after deduction")

r = requests.get(f"{BASE}/api/meal-schedules/{meal3['_id']}/ingredients")
ings = r.json()
ch = next((i for i in ings if i["name"] == "Chicken"), None)
check("Chicken ingredient found", ch is not None)
check("missing=False (7kg still in stock for this meal's record)", ch and ch["missing"] == False, ch)
check("inventory_quantity reflects deducted value (7.0)", ch and ch["inventory_quantity"] == 7.0, ch)
print("  INFO: After deduction, inventory shows 7kg correctly")

# ============================================================
# CLEANUP
# ============================================================
section("CLEANUP")
cleanup(inv_ids, recipe_ids, meal_ids)
print(f"  Cleaned {len(inv_ids)} inventory, {len(recipe_ids)} recipes, {len(meal_ids)} meals")

# ============================================================
# SUMMARY
# ============================================================
section("SUMMARY")
passed = sum(results)
total  = len(results)
print(f"\n  {passed}/{total} checks passed")
if passed == total:
    print("  ALL TESTS PASSED - Dynamic inventory consumption working!\n")
else:
    print(f"  {total-passed} FAILED - see above\n")
    sys.exit(1)
