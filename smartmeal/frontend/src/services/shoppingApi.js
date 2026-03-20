/**
 * Shopping API Service
 * All HTTP calls to the FastAPI shopping endpoints.
 * Backend base path: /api/shopping/*
 */

const API_BASE_URL = "http://localhost:8001/api";

const ShoppingAPI = {
  /** GET /api/shopping/all?user_id=...&status_filter=... */
  async getItems(userId, statusFilter = '') {
    const params = new URLSearchParams({ user_id: userId });
    if (statusFilter) params.append('status_filter', statusFilter);
    const response = await fetch(`${API_BASE_URL}/shopping/all?${params}`);
    if (!response.ok) throw new Error('Failed to load items');
    return response.json();
  },

  /** GET /api/shopping/stats?user_id=... */
  async getStats(userId) {
    const response = await fetch(
      `${API_BASE_URL}/shopping/stats?user_id=${encodeURIComponent(userId)}`
    );
    if (!response.ok) throw new Error('Failed to load stats');
    return response.json();
  },

  /** POST /api/shopping/add */
  async addItem(itemData) {
    const response = await fetch(`${API_BASE_URL}/shopping/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to add item');
    }
    return response.json();
  },

  /** PUT /api/shopping/update/:id */
  async updateItem(itemId, updateData) {
    const response = await fetch(`${API_BASE_URL}/shopping/update/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to update item');
    }
    return response.json();
  },

  /** PATCH /api/shopping/mark-bought/:id */
  async markBought(itemId) {
    const response = await fetch(`${API_BASE_URL}/shopping/mark-bought/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to mark item as bought');
    }
    return response.json();
  },

  /** DELETE /api/shopping/delete/:id */
  async deleteItem(itemId) {
    const response = await fetch(`${API_BASE_URL}/shopping/delete/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to delete item');
    }
    return response.json();
  },

  /** DELETE /api/shopping/clear-bought?user_id=... */
  async clearBought(userId) {
    const response = await fetch(
      `${API_BASE_URL}/shopping/clear-bought?user_id=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to clear bought items');
    return response.json();
  },
};

export default ShoppingAPI;
