import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include token in all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No token found in localStorage for request to:', config.url);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Track whether we've already triggered a logout redirect to prevent duplicates
let _isRedirectingToLogin = false;

// Response interceptor — 401 handling
// Strategy:
//   • /api/auth/* endpoints returning 401 → always logout (bad credentials)
//   • All other endpoints returning 401 → reject error, let the component handle it
//     The user stays logged in. The component shows an inline error message.
// This prevents the "click Add to Shopping List → gets logged out" bug.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url      = error.config?.url || '';
      const hasToken = !!localStorage.getItem('token');

      // Only auto-logout for real auth failures on auth endpoints
      // OR if there's no token at all and we're hitting a protected page load
      const shouldLogout = url.includes('/api/auth/') && !_isRedirectingToLogin;

      if (shouldLogout) {
        console.error('[axios] Auth 401 on auth endpoint — logging out.');
        _isRedirectingToLogin = true;
        localStorage.removeItem('token');
        setTimeout(() => { window.location.href = '/login'; }, 100);
      } else {
        // Non-auth 401: log for debugging, DO NOT redirect
        console.warn(`[axios] 401 on ${url} — returning error to caller, NOT logging out.`);
      }
    }
    return Promise.reject(error);
  }
);

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

/** OAuth2 password flow: backend expects application/x-www-form-urlencoded with username + password. */
export function postOAuthLogin(apiInstance, email, password) {
  const params = new URLSearchParams();
  params.append('username', email.trim());
  params.append('password', password);
  return apiInstance.post('/api/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
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

