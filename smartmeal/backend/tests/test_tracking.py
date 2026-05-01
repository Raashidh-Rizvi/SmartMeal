# -*- coding: utf-8 -*-
import requests
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = "http://localhost:8001"
results = []

def check(label, condition, actual=None):
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {label}")
    if not condition and actual is not None:
        print(f"         Got: {actual}")
    results.append(condition)
    return condition

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def cleanup(inv_ids, recipe_ids, meal_ids, shopping_ids):
    for i in inv_ids:
        requests.delete(f"{BASE}/api/inventory/{i}")
    for r in recipe_ids:
        requests.delete(f"{BASE}/api/recipes/{r}")
    for m in meal_ids:
        requests.delete(f"{BASE}/api/meal-schedules/{m}")
    for s in shopping_ids:
        requests.delete(f"{BASE}/api/shopping/delete/{s}")

inv_ids, recipe_ids, meal_ids, shopping_ids = [], [], [], []

# ============================================================
# TEST 1: Inventory SUFFICIENT — Chicken 10kg, Recipe 1kg
# Expected: missing=False, missing_quantity=0
# ============================================================
section("TEST 1: Inventory SUFFICIENT — Chicken 10kg, Recipe needs 1kg")

r = requests.post(f"{BASE}/api/inventory", json={"name":"Chicken","quantity":10,"unit":"kg","category":"Meat"})
check("POST /api/inventory status=200", r.status_code == 200, r.status_code)
inv = r.json()
inv_ids.append(inv.get("_id"))
check("userId saved as 1", inv.get("userId") == "1", inv.get("userId"))
check("quantity=10", inv.get("quantity") == 10, inv.get("quantity"))
check("unit=kg", inv.get("unit") == "kg", inv.get("unit"))

r = requests.post(f"{BASE}/api/recipes", json={
    "title": "Test Chicken Dish",
    "category": "dinner",
    "ingredients": [{"name": "Chicken", "quantity": 1, "unit": "kg"}],
    "preparation_steps": ["Cook chicken"],
    "dietary_tags": [],
})
check("POST /api/recipes status=200", r.status_code == 200, r.status_code)
recipe = r.json()
recipe_id = recipe.get("_id")
recipe_ids.append(recipe_id)

r = requests.post(f"{BASE}/api/meal-schedules/", json={
    "user_id": "1", "recipe_id": recipe_id,
    "meal_date": "2026-06-01", "meal_type": "dinner",
    "status": "planned", "servings": 1,
})
check("POST /api/meal-schedules status=200", r.status_code == 200, r.status_code)
meal = r.json()
meal_id = meal.get("_id")
meal_ids.append(meal_id)
check("No warnings (10kg >= 1kg)", len(meal.get("warnings", [])) == 0, meal.get("warnings"))

r = requests.get(f"{BASE}/api/meal-schedules/{meal_id}/ingredients")
ings = r.json()
chicken = next((i for i in ings if i["name"] == "Chicken"), None)
check("Chicken found in ingredients", chicken is not None)
check("missing=False", chicken.get("missing") == False, chicken)
check("missing_quantity=0.0", chicken.get("missing_quantity") == 0.0, chicken.get("missing_quantity"))
check("inventory_quantity=10.0", chicken.get("inventory_quantity") == 10.0, chicken.get("inventory_quantity"))
print("  INFO: Chicken 10kg in stock, recipe needs 1kg -> NO missing (correct)")

# ============================================================
# TEST 2: Inventory INSUFFICIENT — Rice 0.5kg, Recipe 1kg
# Expected: missing=True, missing_quantity=0.5
# ============================================================
section("TEST 2: Inventory INSUFFICIENT — Rice 0.5kg, Recipe needs 1kg")

r = requests.post(f"{BASE}/api/inventory", json={"name":"Rice","quantity":0.5,"unit":"kg","category":"Grains"})
check("POST /api/inventory status=200", r.status_code == 200, r.status_code)
inv2 = r.json()
inv_ids.append(inv2.get("_id"))
check("quantity=0.5", inv2.get("quantity") == 0.5, inv2.get("quantity"))

r = requests.post(f"{BASE}/api/recipes", json={
    "title": "Test Rice Dish",
    "category": "lunch",
    "ingredients": [{"name": "Rice", "quantity": 1, "unit": "kg"}],
    "preparation_steps": ["Cook rice"],
    "dietary_tags": [],
})
check("POST /api/recipes status=200", r.status_code == 200, r.status_code)
recipe2 = r.json()
recipe_id2 = recipe2.get("_id")
recipe_ids.append(recipe_id2)

r = requests.post(f"{BASE}/api/meal-schedules/", json={
    "user_id": "1", "recipe_id": recipe_id2,
    "meal_date": "2026-06-02", "meal_type": "lunch",
    "status": "planned", "servings": 1,
})
check("POST /api/meal-schedules status=200", r.status_code == 200, r.status_code)
meal2 = r.json()
meal_id2 = meal2.get("_id")
meal_ids.append(meal_id2)
check("Warning shown (0.5kg < 1kg)", len(meal2.get("warnings", [])) > 0, meal2.get("warnings"))

r = requests.get(f"{BASE}/api/meal-schedules/{meal_id2}/ingredients")
ings2 = r.json()
rice = next((i for i in ings2 if i["name"] == "Rice"), None)
check("Rice found in ingredients", rice is not None)
check("missing=True", rice.get("missing") == True, rice)
check("missing_quantity=0.5", rice.get("missing_quantity") == 0.5, rice.get("missing_quantity"))
check("inventory_quantity=0.5", rice.get("inventory_quantity") == 0.5, rice.get("inventory_quantity"))

# Add missing to shopping list
r = requests.post(f"{BASE}/api/shopping/add", json={
    "user_id": "1", "name": "Rice",
    "quantity": rice.get("missing_quantity"),
    "unit": rice.get("unit"),
    "category": "meal-ingredient",
    "meal_id": meal_id2,
    "notes": "From Meal: Test Rice Dish (2026-06-02)",
    "status": "pending",
})
check("POST /api/shopping/add status=200", r.status_code == 200, r.status_code)
shop = r.json()
shopping_ids.append(shop.get("_id"))
check("Shopping quantity=0.5 (only missing)", shop.get("quantity") == 0.5, shop.get("quantity"))
check("Shopping unit=kg", shop.get("unit") == "kg", shop.get("unit"))
check("Shopping meal_id linked", shop.get("meal_id") == meal_id2, shop.get("meal_id"))
print("  INFO: Rice 0.5kg in stock, recipe needs 1kg -> missing 0.5kg added to shopping (correct)")

# ============================================================
# TEST 3: Unit Conversion — Inventory 500g, Recipe 0.3kg
# 500g >= 300g (0.3kg) -> no missing
# ============================================================
section("TEST 3: Unit Conversion — Inventory 500g Salt, Recipe needs 0.3kg")

r = requests.post(f"{BASE}/api/inventory", json={"name":"Salt","quantity":500,"unit":"g","category":"Spices"})
check("POST /api/inventory status=200", r.status_code == 200, r.status_code)
inv3 = r.json()
inv_ids.append(inv3.get("_id"))

r = requests.post(f"{BASE}/api/recipes", json={
    "title": "Test Salt Dish",
    "category": "snack",
    "ingredients": [{"name": "Salt", "quantity": 0.3, "unit": "kg"}],
    "preparation_steps": ["Add salt"],
    "dietary_tags": [],
})
check("POST /api/recipes status=200", r.status_code == 200, r.status_code)
recipe3 = r.json()
recipe_id3 = recipe3.get("_id")
recipe_ids.append(recipe_id3)

r = requests.post(f"{BASE}/api/meal-schedules/", json={
    "user_id": "1", "recipe_id": recipe_id3,
    "meal_date": "2026-06-03", "meal_type": "snack",
    "status": "planned", "servings": 1,
})
check("POST /api/meal-schedules status=200", r.status_code == 200, r.status_code)
meal3 = r.json()
meal_id3 = meal3.get("_id")
meal_ids.append(meal_id3)

r = requests.get(f"{BASE}/api/meal-schedules/{meal_id3}/ingredients")
ings3 = r.json()
salt = next((i for i in ings3 if i["name"] == "Salt"), None)
check("Salt found in ingredients", salt is not None)
check("missing=False (500g >= 300g)", salt.get("missing") == False, salt)
check("missing_quantity=0.0", salt.get("missing_quantity") == 0.0, salt.get("missing_quantity"))
print("  INFO: 500g >= 0.3kg (300g) after unit conversion -> NO missing (correct)")

# ============================================================
# TEST 4: Servings Multiplier — Milk 1L, Recipe 0.5L x 3 servings
# Need 1.5L, have 1L -> missing 0.5L
# ============================================================
section("TEST 4: Servings x3 — Milk 1L, Recipe 0.5L x 3 servings = need 1.5L")

r = requests.post(f"{BASE}/api/inventory", json={"name":"Milk","quantity":1,"unit":"L","category":"Dairy"})
check("POST /api/inventory status=200", r.status_code == 200, r.status_code)
inv4 = r.json()
inv_ids.append(inv4.get("_id"))

r = requests.post(f"{BASE}/api/recipes", json={
    "title": "Test Milk Dish",
    "category": "breakfast",
    "ingredients": [{"name": "Milk", "quantity": 0.5, "unit": "L"}],
    "preparation_steps": ["Add milk"],
    "dietary_tags": [],
})
check("POST /api/recipes status=200", r.status_code == 200, r.status_code)
recipe4 = r.json()
recipe_id4 = recipe4.get("_id")
recipe_ids.append(recipe_id4)

r = requests.post(f"{BASE}/api/meal-schedules/", json={
    "user_id": "1", "recipe_id": recipe_id4,
    "meal_date": "2026-06-04", "meal_type": "breakfast",
    "status": "planned", "servings": 3,
})
check("POST /api/meal-schedules status=200", r.status_code == 200, r.status_code)
meal4 = r.json()
meal_id4 = meal4.get("_id")
meal_ids.append(meal_id4)

r = requests.get(f"{BASE}/api/meal-schedules/{meal_id4}/ingredients")
ings4 = r.json()
milk = next((i for i in ings4 if i["name"] == "Milk"), None)
check("Milk found in ingredients", milk is not None)
check("missing=True (need 1.5L, have 1L)", milk.get("missing") == True, milk)
check("missing_quantity=0.5", milk.get("missing_quantity") == 0.5, milk.get("missing_quantity"))
check("required quantity=1.5 (0.5 x 3)", milk.get("quantity") == 1.5, milk.get("quantity"))
print("  INFO: 0.5L x 3 servings = 1.5L needed, have 1L -> missing 0.5L (correct)")

# ============================================================
# CLEANUP
# ============================================================
section("CLEANUP")
cleanup(inv_ids, recipe_ids, meal_ids, shopping_ids)
print(f"  Removed {len(inv_ids)} inventory, {len(recipe_ids)} recipes, {len(meal_ids)} meals, {len(shopping_ids)} shopping items")

# ============================================================
# SUMMARY
# ============================================================
section("SUMMARY")
passed = sum(results)
total = len(results)
print(f"\n  {passed}/{total} checks passed")
if passed == total:
    print("  ALL TESTS PASSED - Tracking logic is working correctly!\n")
else:
    print(f"  {total - passed} checks FAILED - see above\n")
    sys.exit(1)
