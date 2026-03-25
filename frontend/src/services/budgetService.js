import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/budget';

export const budgetService = {
  createBudget: (data) => 
    axios.post(`${API_BASE_URL}/budgets`, data),
  
  getCurrentBudget: () => 
    axios.get(`${API_BASE_URL}/budgets/current`),
  
  updateBudget: (id, data) => 
    axios.put(`${API_BASE_URL}/budgets/${id}`, data),
  
  deleteBudget: (id) => 
    axios.delete(`${API_BASE_URL}/budgets/${id}`),
  
  createExpense: (data) => 
    axios.post(`${API_BASE_URL}/expenses`, data),
  
  getExpenses: (params) => 
    axios.get(`${API_BASE_URL}/expenses`, { params }),
  
  updateExpense: (id, data) => 
    axios.put(`${API_BASE_URL}/expenses/${id}`, data),
  
  deleteExpense: (id) => 
    axios.delete(`${API_BASE_URL}/expenses/${id}`),
  
  getSummary: () => 
    axios.get(`${API_BASE_URL}/summary`)
};
