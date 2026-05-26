/**
 * Shopping API Service
 * All HTTP calls to the FastAPI shopping endpoints.
 * Backend base path: /api/shopping/*
 */

const API_BASE_URL = "http://localhost:8001/api";

<<<<<<< HEAD
const ShoppingAPI = {
  /** GET /api/shopping/all?user_id=...&status_filter=... */
  async getItems(userId, statusFilter = '') {
    const params = new URLSearchParams({ user_id: userId });
    if (statusFilter) params.append('status_filter', statusFilter);
=======
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

const ShoppingAPI = {
  /** GET /api/shopping/all?user_id=...&status_filter=... */
  async getItems(userId, statusFilter = '', sourceFilter = '') {
    const params = new URLSearchParams({ user_id: userId });
    if (statusFilter) params.append('status_filter', statusFilter);
    if (sourceFilter) params.append('source_filter', sourceFilter);
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    const response = await fetch(`${API_BASE_URL}/shopping/all?${params}`);
    if (!response.ok) throw new Error('Failed to load items');
    return response.json();
  },

<<<<<<< HEAD
  /** GET /api/shopping/stats?user_id=... */
  async getStats(userId) {
    const response = await fetch(
      `${API_BASE_URL}/shopping/stats?user_id=${encodeURIComponent(userId)}`
    );
=======
  /** GET /api/shopping/stats */
  async getStats(userId) {
    const response = await fetch(`${API_BASE_URL}/shopping/stats`, { headers: getAuthHeaders() });
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    if (!response.ok) throw new Error('Failed to load stats');
    return response.json();
  },

  /** POST /api/shopping/add */
  async addItem(itemData) {
    const response = await fetch(`${API_BASE_URL}/shopping/add`, {
      method: 'POST',
<<<<<<< HEAD
      headers: { 'Content-Type': 'application/json' },
=======
      headers: getAuthHeaders(),
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
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
<<<<<<< HEAD
      headers: { 'Content-Type': 'application/json' },
=======
      headers: getAuthHeaders(),
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
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
<<<<<<< HEAD
      headers: { 'Content-Type': 'application/json' },
=======
      headers: getAuthHeaders(),
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
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
<<<<<<< HEAD
=======
      headers: getAuthHeaders(),
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to delete item');
    }
    return response.json();
  },

<<<<<<< HEAD
  /** DELETE /api/shopping/clear-bought?user_id=... */
  async clearBought(userId) {
    const response = await fetch(
      `${API_BASE_URL}/shopping/clear-bought?user_id=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
=======
  /** DELETE /api/shopping/clear-bought */
  async clearBought(userId) {
    const response = await fetch(`${API_BASE_URL}/shopping/clear-bought`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    if (!response.ok) throw new Error('Failed to clear bought items');
    return response.json();
  },
};

export default ShoppingAPI;
