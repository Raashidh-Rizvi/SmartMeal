/**
 * Shopping List Integration Diagnostics
 * Helps verify the meal-to-shopping-list integration is working correctly
 */

import ShoppingAPI from '../services/shoppingApi';

/**
 * Test if backend API is reachable
 */
export const testBackendConnection = async () => {
  try {
    const result = await ShoppingAPI.getStats("1");
    console.log("✅ Backend connection successful. Stats:", result);
    return { success: true, data: result };
  } catch (err) {
    console.error("❌ Backend connection failed:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * List all shopping items in database
 */
export const getAllShoppingItems = async (userId = "1") => {
  try {
    const items = await ShoppingAPI.getItems(userId);
    console.log(`✅ Found ${items.length} items for user ${userId}:`, items);
    return { success: true, count: items.length, items };
  } catch (err) {
    console.error("❌ Failed to fetch items:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Add a test item to verify the add endpoint works
 */
export const addTestItem = async (userId = "1") => {
  try {
    const testItem = {
      user_id: userId,
      name: `TEST_ITEM_${Date.now()}`,
      quantity: 1,
      unit: "test",
      category: "ingredient",
      notes: "Test item added at " + new Date().toISOString(),
      status: "pending"
    };
    
    console.log("📦 Adding test item:", testItem);
    const result = await ShoppingAPI.addItem(testItem);
    console.log("✅ Test item added successfully:", result);
    return { success: true, item: result };
  } catch (err) {
    console.error("❌ Failed to add test item:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Run full diagnostic suite
 */
export const runFullDiagnostics = async (userId = "1") => {
  console.log("\n🔍 === SHOPPING LIST INTEGRATION DIAGNOSTICS ===\n");
  
  // Test 1: Backend connection
  console.log("Test 1: Backend Connection");
  const connTest = await testBackendConnection();
  if (!connTest.success) {
    console.error("❌ Backend is not responding. Check if server is running on http://localhost:8001");
    return { passed: 0, failed: 1, tests: [connTest] };
  }
  
  // Test 2: Get existing items
  console.log("\nTest 2: Fetching Existing Items");
  const getTest = await getAllShoppingItems(userId);
  if (!getTest.success) {
    console.error("❌ Cannot fetch items. Check API configuration.");
    return { passed: 1, failed: 1, tests: [connTest, getTest] };
  }
  console.log(`Found ${getTest.count} items in database for user ${userId}`);
  
  // Test 3: Add test item
  console.log("\nTest 3: Adding Test Item");
  const addTest = await addTestItem(userId);
  if (!addTest.success) {
    console.error("❌ Cannot add item. Check API configuration.");
    return { passed: 2, failed: 1, tests: [connTest, getTest, addTest] };
  }
  
  // Test 4: Verify item was added
  console.log("\nTest 4: Verifying Item was Added");
  const verifyTest = await getAllShoppingItems(userId);
  if (!verifyTest.success) {
    console.error("❌ Cannot verify item.");
    return { passed: 3, failed: 1, tests: [connTest, getTest, addTest, verifyTest] };
  }
  
  const added = verifyTest.items.some(item => item.name === addTest.item?.name);
  if (added) {
    console.log("✅ Test item successfully added to database!");
  } else {
    console.error("❌ Test item was added but not found in database!");
  }
  
  console.log("\n✅ === DIAGNOSTICS COMPLETE ===\n");
  console.log(`Passed: ${added ? 4 : 3}, Failed: ${added ? 0 : 1}`);
  
  return {
    passed: added ? 4 : 3,
    failed: added ? 0 : 1,
    tests: [connTest, getTest, addTest, verifyTest]
  };
};

/**
 * Log the current configuration
 */
export const logConfiguration = () => {
  console.log("📋 === SHOPPING LIST CONFIGURATION ===");
  console.log("Backend Base URL: http://localhost:8001/api");
  console.log("Shopping Endpoints:");
  console.log("  - GET  /api/shopping/all");
  console.log("  - POST /api/shopping/add");
  console.log("  - GET  /api/shopping/stats");
  console.log("User ID: 1 (hardcoded)");
  console.log("=====================================\n");
};

export default {
  testBackendConnection,
  getAllShoppingItems,
  addTestItem,
  runFullDiagnostics,
  logConfiguration
};
