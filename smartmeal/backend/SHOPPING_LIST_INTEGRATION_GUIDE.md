# 🛒 Shopping List Integration - Complete Guide

## Overview
This guide explains how the "Add to List" feature works and how to verify it's functioning correctly.

## How It Works

### 1. **On the Meals Page (`/meals`)**
- When you expand a meal, you see ingredients with a 🥘 icon
- Ingredients marked with ⚠️ Missing have an "Add to List" button
- Clicking the button adds the ingredient to your Shopping List

### 2. **Data Flow**
```
Meals Page → Click "Add to List" → Backend API (/api/shopping/add) 
→ MongoDB (shopping_items collection) → Shopping List Page retrieves items
```

### 3. **On the Shopping List Page (`/shoppinglist`)**
- Items display in a table with: Item Name, Quantity, Unit, Source, Status, Date, Actions
- Items from meals show Source as "Meal Plan"
- Items manually added show Source as "Manual"
- Click ✏️ to edit, ✓ to mark as bought, 🗑️ to delete
- Click 🔄 Refresh button to reload items from server

## Verification Steps

### Step 1: Check Backend is Running
```
Backend should be running on: http://localhost:8001
```

### Step 2: Test API Endpoints Directly
Open browser console (F12) and run:

```javascript
// Import the diagnostic tool
import diagnostics from './utils/shoppingDiagnostics.js';

// Run diagnostics
await diagnostics.runFullDiagnostics('1');
```

OR manually test:

```javascript
// Test 1: Check stats
fetch('http://localhost:8001/api/shopping/stats?user_id=1')
  .then(r => r.json())
  .then(d => console.log('Stats:', d));

// Test 2: Get all items
fetch('http://localhost:8001/api/shopping/all?user_id=1')
  .then(r => r.json())
  .then(d => console.log('Items:', d));

// Test 3: Add test item
fetch('http://localhost:8001/api/shopping/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: '1',
    name: 'Test Item',
    quantity: 1,
    unit: 'test',
    category: 'ingredient',
    notes: 'Test item',
    status: 'pending'
  })
})
.then(r => r.json())
.then(d => console.log('Added:', d));
```

### Step 3: Test Full Integration

1. **Go to `/meals` page**
   - You should see meal schedules
   - Expand a meal to see ingredients

2. **Try Adding an Ingredient**
   - Find an ingredient marked with ⚠️ Missing
   - Click "Add to List" button
   - You should see:
     - Button changes to "⏳ Adding..."
     - Then "✅ Added"
     - A success toast message appears

3. **Go to Shopping List Page**
   - Navigate to `/shoppinglist`
   - The page should load and fetch items from server
   - You should see:
     - The item you just added in the table
     - With columns: Item Name | Quantity | Unit | Source | Status | Date | Actions
     - Source should be "Meal Plan"
     - Status should be "Pending"

## Troubleshooting

### Issue: "Add to List" button shows error
**Problem**: API call is failing
**Solution**:
- Check F12 Console for error message
- Make sure backend is running on http://localhost:8001
- Check network tab to see the POST request to `/api/shopping/add`

### Issue: Item shows as "Added" but doesn't appear in Shopping List
**Problem**: Item was added but Shopping List isn't showing it

**Solution 1**: Refresh the page
- Go to `/shoppinglist` and click 🔄 Refresh button
- Items should appear (this is the most common issue)

**Solution 2**: Check browser console for errors
- Open F12 → Console
- Look for any error messages when loading the Shopping List

**Solution 3**: Verify database
- Run the diagnostic commands above
- Check if items are actually in the database

**Solution 4**: Check user_id consistency
- Both pages use hardcoded user_id = "1"
- If you see items from other users, there might be a misconfig

### Issue: Shopping List shows "No items" even after adding
**Problem**: Items aren't being retrieved

**Checklist**:
```
☐ Is backend running on http://localhost:8001?
☐ Is `/api/shopping/all` endpoint accessible?
☐ Are items in the database? (Check MongoDB)
☐ Is the user_id correct? (should be "1")
☐ Did you click Refresh on the Shopping List page?
☐ Check browser console for errors
```

## Console Debugging

### Enable detailed logging
The code includes `console.log` statements for debugging.Open F12 → Console and filter by:
- Look for "🛒 Shopping" messages
- Look for "✅ Added to shopping list"
- Look for "❌ " for errors

### Check what's in the database
```javascript
// Show all items for user 1
fetch('http://localhost:8001/api/shopping/all?user_id=1')
  .then(r => r.json())
  .then(d => {
    console.table(d); // Shows items in table format
    console.log(JSON.stringify(d, null, 2)); // Shows full JSON
  });
```

## API Endpoint Reference

### Add Item to Shopping List
```
POST /api/shopping/add
Content-Type: application/json

{
  "user_id": "1",
  "name": "Sugar",
  "quantity": 2,
  "unit": "cups",
  "category": "ingredient",
  "notes": "From Meal: Chocolate Cake (03/31/2026)",
  "status": "pending"
}

Response:
{
  "_id": "ObjectId",
  "user_id": "1",
  "name": "Sugar",
  "quantity": 2,
  "unit": "cups",
  "status": "pending",
  "created_at": "2026-03-31T...",
  "updated_at": "2026-03-31T..."
}
```

### Get All Items
```
GET /api/shopping/all?user_id=1&status_filter=pending

Response: Array of items
[
  { "_id": "...", "name": "Sugar", "quantity": 2, ... },
  { "_id": "...", "name": "Flour", "quantity": 3, ... }
]
```

### Get Statistics
```
GET /api/shopping/stats?user_id=1

Response:
{
  "total": 5,
  "bought": 2,
  "pending": 3
}
```

## Data Flow Diagram

```
┌─────────────────────┐
│   Meals Page (/meals)  │
│  Shows Ingredients   │
│  with "Add to List"  │
└──────────┬──────────┘
           │ Click "Add to List"
           ↓
┌─────────────────────────────────┐
│   Frontend: buildShoppingPayload  │
│   Creates item data              │
└──────────┬──────────────────────┘
           │
           ↓
┌──────────────────────────────────┐
│   POST /api/shopping/add          │
│   Sends item to backend           │
└──────────┬───────────────────────┘
           │
           ↓
┌──────────────────────────────────┐
│   Backend: shopping_routes.py     │
│   Inserts into MongoDB            │
│   shopping_items collection       │
└──────────┬───────────────────────┘
           │
           ↓
┌──────────────────────────────────┐
│   Shopping List Page (/shoppinglist) │
│   GET /api/shopping/all            │
│   Fetches items from database      │
│   Displays in table                │
└──────────────────────────────────┘
```

## Common Field Mappings

| Frontend Field | Backend Field | Displayed As |
|---|---|---|
| item.name | name | Item Name |
| item.quantity | quantity | Quantity |
| item.unit | unit | Unit |
| item.category | category | Source (ingredient → Meal Plan, else → Manual) |
| item.status | status | Status (pending → Pending, bought → Bought) |
| item.created_at | created_at | Date (formatted) |

## Next Steps

1. **Verify backend is running**
   ```bash
   # In the backend directory
   python -m uvicorn app.main:app --reload --port 8001
   ```

2. **Test the integration** using the steps above

3. **Check browser DevTools** (F12) for any errors

4. **Review MongoDB** if items aren't persisting

## Quick Test Command

Copy and paste this into your browser console (F12):

```javascript
// Quick diagnostic
(async () => {
  console.log("Testing Shopping List Integration...");
  
  // Test backend
  try {
    const stats = await fetch('http://localhost:8001/api/shopping/stats?user_id=1').then(r => r.json());
    console.log("✅ Backend is running!");
    console.log(`Currently ${stats.total} items (${stats.pending} pending, ${stats.bought} bought)`);
  } catch (e) {
    console.error("❌ Backend is not running or not accessible");
    return;
  }
  
  // Get items
  try {
    const items = await fetch('http://localhost:8001/api/shopping/all?user_id=1').then(r => r.json());
    console.log(`✅ Fetched ${items.length} items:`, items);
  } catch (e) {
    console.error("❌ Failed to fetch items:", e);
  }
})();
```

---

**Last Updated**: March 31, 2026
**For issues**: Check console logs and verify backend connection
