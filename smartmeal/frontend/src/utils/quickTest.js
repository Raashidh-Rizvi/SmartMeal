/**
 * Quick Integration Test - Use in browser console
 * Tests if shopping list items are being added and retrieved correctly
 */

// Run this in browser console (F12) on the Shopping List page:

(async () => {
  console.log("\n🧪 === SHOPPING LIST INTEGRATION TEST ===\n");
  
  const userId = "1";
  const API_BASE = "http://localhost:8001/api";

  // Test 1: Get current items
  console.log("Test 1: Fetching current items...");
  try {
    const response = await fetch(`${API_BASE}/shopping/all?user_id=${userId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = await response.json();
    console.log(`✅ Found ${items.length} items:`, items);
    global._currentItems = items; // Save for reference
    
    if (items.length === 0) {
      console.warn("⚠️  No items in shopping list. Try adding one from the Meals page.");
    }
  } catch (e) {
    console.error("❌ Failed to fetch items:", e.message);
    return;
  }

  // Test 2: Add a test item
  console.log("\nTest 2: Adding test item...");
  const testName = `TEST_${Date.now()}`;
  try {
    const response = await fetch(`${API_BASE}/shopping/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name: testName,
        quantity: 1,
        unit: "test",
        category: "ingredient",
        notes: "Test item added at " + new Date().toISOString(),
        status: "pending"
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    const added = await response.json();
    console.log("✅ Test item added:", added);
  } catch (e) {
    console.error("❌ Failed to add test item:", e.message);
    return;
  }

  // Test 3: Verify item appears
  console.log("\nTest 3: Verifying item was saved...");
  try {
    const response = await fetch(`${API_BASE}/shopping/all?user_id=${userId}`);
    const items = await response.json();
    const found = items.find(item => item.name === testName);
    
    if (found) {
      console.log("✅ Test item found in database:", found);
      console.log("\n✅ === INTEGRATION WORKING CORRECTLY ===\n");
      console.log("Your shopping list integration is working!");
      console.log("Items added from Meals page should appear here.");
      console.log("If they don't, the page might need to be refreshed.");
    } else {
      console.error("❌ Test item was added but NOT found in database!");
      console.log("This suggests items aren't persisting.");
      console.log("Items in database:", items);
    }
  } catch (e) {
    console.error("❌ Failed to verify:", e.message);
  }
})();

// Also, check the page's ShoppingList state:
console.log("\n📋 Checking ShoppingList page state...");
console.log("Look at the 'items' rendered in the table above.");
console.log("If table is empty but API returns items, there's a data transformation issue.");
