import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptor to include token in all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Helper to convert camelCase to snake_case for backend
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

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

export const ShoppingAPI = {
  async getItems(userId, statusFilter = '') {
    const params = { user_id: userId };
    if (statusFilter) params.status_filter = statusFilter;
    const response = await api.get('/api/shopping/all', { params });
    return response.data;
  },

  async getStats(userId) {
    const response = await api.get(`/api/shopping/stats?user_id=${encodeURIComponent(userId)}`);
    return response.data;
  },

  async addItem(itemData) {
    const snakeCaseData = convertToSnakeCase(itemData);
    const response = await api.post('/api/shopping/add', snakeCaseData);
    return response.data;
  },

  async updateItem(itemId, updateData) {
    const snakeCaseData = convertToSnakeCase(updateData);
    const response = await api.put(`/api/shopping/update/${itemId}`, snakeCaseData);
    return response.data;
  },

  async markBought(itemId) {
    const response = await api.patch(`/api/shopping/mark-bought/${itemId}`);
    return response.data;
  },

  async deleteItem(itemId) {
    const response = await api.delete(`/api/shopping/delete/${itemId}`);
    return response.data;
  },

  async clearBought(userId) {
    const response = await api.delete(`/api/shopping/clear-bought?user_id=${encodeURIComponent(userId)}`);
    return response.data;
  }
};

export default api;

