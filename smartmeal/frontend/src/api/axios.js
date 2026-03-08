/**
 * API Service
 * Centralises all HTTP calls to the FastAPI backend.
 * 
 * Uses snake_case throughout to match Python PEP 8 standards.
 * Backend returns snake_case, frontend works with snake_case.
 *
 * The full-stack app runs on: http://localhost:8000
 *
 * Change API_BASE_URL below if your backend runs on a different host/port.
 */

const API_BASE_URL = "http://localhost:8000";

// Helper to convert camelCase to snake_case for backend
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

// Helper to convert object keys from camelCase to snake_case
function convertToSnakeCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertToSnakeCase);
  if (typeof obj !== 'object') return obj;
  
  const result = {};
  for (const key in obj) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = convertToSnakeCase(obj[key]);
  }
  return result;
}

// Helper to convert snake_case to camelCase for frontend (if needed)
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Helper to convert object keys from snake_case to camelCase
function convertToCamelCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertToCamelCase);
  if (typeof obj !== 'object') return obj;
  
  const result = {};
  for (const key in obj) {
    const camelKey = toCamelCase(key);
    result[camelKey] = convertToCamelCase(obj[key]);
  }
  return result;
}

const ShoppingAPI = {
  /**
   * Fetch all shopping items for a user (with optional status filter)
   * GET /shopping/all?user_id=...
   */
  async getItems(userId, statusFilter = '') {
    const params = new URLSearchParams({ user_id: userId });
    if (statusFilter) params.append('status_filter', statusFilter);
    const response = await fetch(`${API_BASE_URL}/shopping/all?${params}`);
    if (!response.ok) throw new Error('Failed to load items');
    const data = await response.json();
    return data; // Backend returns snake_case, we keep it as snake_case
  },

  /**
   * Fetch statistics for a user
   * GET /shopping/stats?user_id=...
   */
  async getStats(userId) {
    const response = await fetch(`${API_BASE_URL}/shopping/stats?user_id=${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error('Failed to load stats');
    const data = await response.json();
    return data; // Backend returns snake_case, we keep it as snake_case
  },

  /**
   * Add a new shopping item
   * POST /shopping/add
   */
  async addItem(itemData) {
    // Convert camelCase to snake_case for backend
    const snakeCaseData = convertToSnakeCase(itemData);
    
    const response = await fetch(`${API_BASE_URL}/shopping/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snakeCaseData)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to add item');
    }
    const data = await response.json();
    return data; // Backend returns snake_case, we keep it as snake_case
  },

  /**
   * Update an existing shopping item
   * PUT /shopping/update/:id
   */
  async updateItem(itemId, updateData) {
    // Convert camelCase to snake_case for backend
    const snakeCaseData = convertToSnakeCase(updateData);
    
    const response = await fetch(`${API_BASE_URL}/shopping/update/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snakeCaseData)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to update item');
    }
    const data = await response.json();
    return data; // Backend returns snake_case, we keep it as snake_case
  },

  /**
   * Mark an item as bought
   * PATCH /shopping/mark-bought/:id
   */
  async markBought(itemId) {
    const response = await fetch(`${API_BASE_URL}/shopping/mark-bought/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to mark item as bought');
    }
    const data = await response.json();
    return data; // Backend returns snake_case, we keep it as snake_case
  },

  /**
   * Delete a shopping item
   * DELETE /shopping/delete/:id
   */
  async deleteItem(itemId) {
    const response = await fetch(`${API_BASE_URL}/shopping/delete/${itemId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to delete item');
    }
    return response.json();
  },

  /**
   * Clear all bought items for a user
   * DELETE /shopping/clear-bought?user_id=...
   */
  async clearBought(userId) {
    const response = await fetch(
      `${API_BASE_URL}/shopping/clear-bought?user_id=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to clear bought items');
    return response.json();
  }
};
