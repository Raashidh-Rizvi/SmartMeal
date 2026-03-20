import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/leftovers';

export const leftoverService = {
  getAll: (includeUsed = false) => 
    axios.get(`${API_BASE_URL}?include_used=${includeUsed}`),
  
  getExpiringSoon: (days = 3) => 
    axios.get(`${API_BASE_URL}/expiring-soon?days=${days}`),
  
  getById: (id) => 
    axios.get(`${API_BASE_URL}/${id}`),
  
  create: (data) => 
    axios.post(API_BASE_URL, data),
  
  update: (id, data) => 
    axios.put(`${API_BASE_URL}/${id}`, data),
  
  markUsed: (id) => 
    axios.patch(`${API_BASE_URL}/${id}/mark-used`),
  
  delete: (id) => 
    axios.delete(`${API_BASE_URL}/${id}`)
};
