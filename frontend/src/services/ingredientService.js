import axios from "axios";

const API = "http://127.0.0.1:8000/ingredients";

// Base ingredients
export const getBaseIngredients = (params = {}) => axios.get(API + "/base", { params });
export const createBaseIngredient = (data) => axios.post(API + "/base", data);
export const updateBaseIngredient = (id, data) => axios.put(`${API}/base/${id}`, data);
export const deleteBaseIngredient = (id) => axios.delete(`${API}/base/${id}`);

// Inventory items
export const getInventoryItems = (params = {}) => axios.get(API + "/inventory", { params });
export const createInventoryItem = (data) => axios.post(API + "/inventory", data);
export const updateInventoryItem = (id, data) => axios.put(`${API}/inventory/${id}`, data);
export const deleteInventoryItem = (id) => axios.delete(`${API}/inventory/${id}`);

// Legacy compatibility
export const getIngredients = getBaseIngredients;
export const createIngredient = createBaseIngredient;
export const updateIngredient = updateBaseIngredient;
export const deleteIngredient = deleteBaseIngredient;