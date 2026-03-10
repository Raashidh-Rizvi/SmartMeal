/**
 * Axios instance for authenticated API calls.
 * Automatically attaches the JWT token from localStorage to every request.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8001',
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
