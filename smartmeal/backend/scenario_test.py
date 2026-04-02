# -*- coding: utf-8 -*-
import requests, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = 'http://localhost:8001'

def inv_get():
    return requests.get(f'{BASE}/api/inventory/').json().get('items', [])

def inv_post(name, qty, unit, cat='Test'):
    return requests.post(f'{BASE}/api/inventory/', json={'name':name,'quantity':qty,'unit':unit,'category':cat}).json()

def inv_del(id):
    requests.delete(f'{BASE}/api/inventory/{id}')

def recipe_post(title, cat, ings):
    return requests.post(f'{BASE}/api/recipes/', json={'title':title,'category':cat,'ingredients':ings,'preparation_steps':['Cook'],'dietary_tags':[]}).json()

def recipe_del(id):
    requests.delete(f'{BASE}/api/recipes/{id}')

def meal_post(recipe_id, date, mtype, servings=1):
    return requests.post(f'{BASE}/api/meal-schedules/', json={'user_id':'1','recipe_id':recipe_id,'meal_date':date,'meal_type':mtype,'status':'planned','servings':servings}).json()

def meal_del(id):
    requests.delete(f'{BASE}/api/meal-schedules/{id}')

def shop_get():
    return requests.get(f'{BASE}/api/shopping/all?user_id=1').json()

def shop_del(id):
    requests.delete(f'{BASE}/api/shopping/delete/{id}')

# ── pre-cleanup ───────────────────────────────────────────────
for i in inv_get():
    if i['name'] in ['Milk', 'Chicken']:
        inv_del(i['_id'])
for s in shop_get():
    if s.get('category') == 'meal-ingredient':
        shop_del(s['_id'])

print('='*60)
print('SCENARIO: Milk 10L, two meals of 5L each, third shows missing')
print('='*60)

# Setup
inv  = inv_post('Milk', 10, 'L', 'Dairy')
print(f'Inventory created: Milk {inv["quantity"]}L (id={inv["_id"]})')

recipe = recipe_post('MilkJuice', 'breakfast', [{'name':'Milk','quantity':5,'unit':'L'}])
print(f'Recipe created: {recipe["title"]} (id={recipe["_id"]})')

# Meal 1 — inventory 10L, needs 5L → OK, inventory becomes 5L
m1 = meal_post(recipe['_id'], '2026-04-02', 'breakfast')
inv_after1 = next((i for i in inv_get() if i['name']=='Milk'), None)
w1 = m1.get('warnings', [])
print(f'\nMeal 1 (2026-04-02):')
print(f'  warnings : {w1}')
print(f'  inventory: {inv_after1["quantity"]}L')
print(f'  -> {"PASS" if len(w1)==0 and inv_after1["quantity"]==5.0 else "FAIL"} (expected: no warnings, inventory=5L)')

# Meal 2 — inventory 5L, needs 5L → OK, inventory becomes 0L
m2 = meal_post(recipe['_id'], '2026-04-03', 'breakfast')
inv_after2 = next((i for i in inv_get() if i['name']=='Milk'), None)
w2 = m2.get('warnings', [])
print(f'\nMeal 2 (2026-04-03):')
print(f'  warnings : {w2}')
print(f'  inventory: {inv_after2["quantity"]}L')
print(f'  -> {"PASS" if len(w2)==0 and inv_after2["quantity"]==0.0 else "FAIL"} (expected: no warnings, inventory=0L)')

# Meal 3 — inventory 0L, needs 5L → MISSING 5L, auto-added to shopping
m3 = meal_post(recipe['_id'], '2026-04-04', 'breakfast')
w3 = m3.get('warnings', [])
shop = shop_get()
milk_shop = next((s for s in shop if s['name']=='Milk' and s.get('meal_id')==m3.get('_id')), None)
print(f'\nMeal 3 (2026-04-04):')
print(f'  warnings : {w3}')
print(f'  shopping : {milk_shop}')
print(f'  -> {"PASS" if len(w3)>0 else "FAIL"} warnings (expected: missing 5L)')
print(f'  -> {"PASS" if milk_shop and milk_shop["quantity"]==5.0 else "FAIL"} shopping (expected: 5L auto-added)')

# get_meals — should use stored snapshot, not recalculate
print(f'\nget_meals stored warnings:')
meals = requests.get(f'{BASE}/api/meal-schedules/').json()
for m in sorted([x for x in meals if x.get('recipe_title')=='MilkJuice'], key=lambda x: x['meal_date']):
    w = m.get('warnings', [])
    expected_ok = m['meal_date'] in ['2026-04-02', '2026-04-03']
    expected_missing = m['meal_date'] == '2026-04-04'
    result = 'PASS' if (expected_ok and len(w)==0) or (expected_missing and len(w)>0) else 'FAIL'
    print(f'  [{result}] {m["meal_date"]}: {"OK" if len(w)==0 else "MISSING: "+str(w)}')

# cleanup
inv_del(inv['_id'])
recipe_del(recipe['_id'])
for m in [m1, m2, m3]:
    if m.get('_id'):
        meal_del(m['_id'])
for s in shop_get():
    if s.get('category') == 'meal-ingredient':
        shop_del(s['_id'])
print('\nCleanup done.')
