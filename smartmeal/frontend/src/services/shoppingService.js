/**
 * Shopping List Service
 * Handles integration between Meal Schedule and Shopping List
 * Uses ONLY ShoppingItemCreate fields to ensure compatibility
 */

import axios from '../api/axios';

/**
 * Add a new shopping list item using the basic endpoint
 * Compatible with ShoppingItemCreate model (no meal_id, recipe_id, recipe_title)
 * 
 * @param {Object} payload - Shopping item data
 *   - user_id: string (required)
 *   - name: string (required)
 *   - quantity: number (optional, default: 1)
 *   - unit: string (optional, default: "")
 *   - category: string (optional, default: "")
 *   - notes: string (optional, default: "")
 *   - status: string (optional, default: "pending")
 * 
 * @returns {Promise} Axios response with created item
 * 
 * Example:
 * const payload = {
 *   user_id: "1",
 *   name: "Sugar",
 *   quantity: 2,
 *   unit: "cups",
 *   category: "ingredient",
 *   notes: "From Meal: Chocolate Cake (2026-03-31)",
 *   status: "pending"
 * };
 * await addToShoppingList(payload);
 */
export const addToShoppingList = async (payload) => {
  try {
    const response = await axios.post('/api/shopping/add', payload);
    console.log("✅ Shopping List API Response:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Shopping List API Error:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Get all shopping list items for a user
 * 
 * @param {string} userId - User ID
 * @param {string} statusFilter - Optional status filter ("pending", "bought", etc)
 * @returns {Promise} Array of shopping items
 */
export const getShoppingItems = async (userId, statusFilter = null) => {
  try {
    const params = { user_id: userId };
    if (statusFilter) {
      params.status_filter = statusFilter;
    }
    const response = await axios.get('/api/shopping/all', { params });
    console.log("✅ Fetched items from API:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Failed to fetch items:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Get shopping statistics for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise} Stats object {total, bought, pending}
 */
export const getShoppingStats = (userId) => {
  return axios.get('/api/shopping/stats', { params: { user_id: userId } });
};

/**
 * Update a shopping list item
 * 
 * @param {string} itemId - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Updated item
 */
export const updateShoppingItem = (itemId, updates) => {
  return axios.put(`/api/shopping/update/${itemId}`, updates);
};

/**
 * Mark a shopping item as bought
 * 
 * @param {string} itemId - Item ID
 * @returns {Promise} Updated item
 */
export const markAsBought = (itemId) => {
  return axios.patch(`/api/shopping/mark-bought/${itemId}`);
};

/**
 * Delete a shopping item
 * 
 * @param {string} itemId - Item ID
 * @returns {Promise} Success response
 */
export const deleteShoppingItem = (itemId) => {
  return axios.delete(`/api/shopping/delete/${itemId}`);
};

/**
 * Clear all bought items from shopping list
 * 
 * @param {string} userId - User ID
 * @returns {Promise} Number of deleted items
 */
export const clearBoughtItems = (userId) => {
  return axios.delete('/api/shopping/clear-bought', { params: { user_id: userId } });
};
