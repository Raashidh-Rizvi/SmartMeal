import axios from '../api/axios';

export const getMeals = () => axios.get('/api/meal-schedules/');
export const createMeal = (data) => axios.post('/api/meal-schedules/', data);
export const updateMeal = (id, data) => axios.put(`/api/meal-schedules/${id}`, data);
export const deleteMeal = (id) => axios.delete(`/api/meal-schedules/${id}`);
export const getMealIngredients = (id) => axios.get(`/api/meal-schedules/${id}/ingredients`);
export const addToShoppingListFromMeal = (data) => axios.post('/api/shopping/add-from-meal', data);
