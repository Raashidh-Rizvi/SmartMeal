import axios from "axios";

const API = "http://127.0.0.1:8000/recipes";

export const getRecipes = (params = {}) => axios.get(API + "/", { params });

export const createRecipe = (data) => axios.post(API + "/", data);

export const updateRecipe = (id, data) => axios.put(`${API}/${id}`, data);

export const deleteRecipe = (id) => axios.delete(`${API}/${id}`);

export const getRecipeById = (id) => axios.get(`${API}/${id}`);