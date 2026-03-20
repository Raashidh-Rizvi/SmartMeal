import api from '../api/axios';

export const budgetService = {
  createBudget: (data) =>
    api.post('/api/budget/budgets', data),
  getCurrentBudget: () =>
    api.get('/api/budget/budgets/current'),
  updateBudget: (id, data) =>
    api.put(`/api/budget/budgets/${id}`, data),
  deleteBudget: (id) =>
    api.delete(`/api/budget/budgets/${id}`),
  createExpense: (data) =>
    api.post('/api/budget/expenses', data),
  getExpenses: (params) =>
    api.get('/api/budget/expenses', { params }),
  updateExpense: (id, data) =>
    api.put(`/api/budget/expenses/${id}`, data),
  deleteExpense: (id) =>
    api.delete(`/api/budget/expenses/${id}`),
  getSummary: () =>
    api.get('/api/budget/summary'),
};
