import api from './axios';

/**
 * Recipe API helpers — all requests automatically include the JWT token
 * via the Axios interceptor defined in axios.js.
 */

/**
 * @param {Object} params - { search, category, created_by, skip, limit }
 */
export const getRecipes = (params = {}) =>
    api.get('/api/recipes/', { params });

/**
 * @param {string} id - Recipe ObjectId string
 */
export const getRecipeById = (id) =>
    api.get(`/api/recipes/${id}`);

/**
 * @param {Object} data - RecipeCreate payload
 */
export const createRecipe = (data) =>
    api.post('/api/recipes', data);

/**
 * @param {string} id - Recipe ObjectId string
 * @param {Object} data - RecipeUpdate payload (partial)
 */
export const updateRecipe = (id, data) =>
    api.put(`/api/recipes/${id}`, data);

/**
 * @param {string} id - Recipe ObjectId string
 */
export const deleteRecipe = (id) =>
    api.delete(`/api/recipes/${id}`);

/**
 * Upload an image file and receive back a hosted URL.
 * @param {File} file - The image File object from an <input type="file">
 */
export const uploadRecipeImage = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
