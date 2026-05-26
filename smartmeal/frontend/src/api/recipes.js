import api from './axios';

/**
 * Recipe API helpers — all requests automatically include the JWT token
 * via the Axios interceptor defined in axios.js.
 */

/**
 * @param {Object} params - { search, category, created_by, skip, limit }
 */
export const getRecipes = (params = {}) =>
<<<<<<< HEAD
    api.get('/api/recipes', { params });
=======
    api.get('/api/recipes/', { params });
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

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
<<<<<<< HEAD
=======
 * Get filtered recipe recommendations
 * @param {Object} filters - { spicy, cooking_time_max, diet, limit }
 */
export const getRecommendations = (filters = {}) =>
    api.get('/api/recipes/recommendations', { params: filters });

/**
 * Rate a recipe
 * @param {string} recipeId - Recipe ID
 * @param {number} rating - Rating 1-5
 */
export const rateRecipe = (recipeId, rating) =>
    api.post(`/api/recipes/${recipeId}/rate`, { rating });

/**
 * AI recipe search — TF-IDF + cosine similarity
 * @param {string} query  - free text, e.g. "chicken rice spicy"
 * @param {Object} opts   - { top_n, diet, cooking_time_max }
 */
export const searchRecommendations = (query, opts = {}) =>
    api.post('/api/recommendations/search', { query, top_n: opts.top_n ?? 5, ...opts });

/**
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
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
<<<<<<< HEAD
=======

/**
 * Toggle favorite status for a recipe
 * @param {string} recipeId 
 */
export const toggleFavoriteRecipe = (recipeId) =>
    api.post(`/api/recipes/${recipeId}/toggle-favorite`);

/**
 * Get all recipes favorited by the current user
 */
export const getFavoriteRecipes = (params = {}) =>
    api.get('/api/recipes/user/favorites', { params });

/**
 * Full AI pipeline — TF-IDF match + Azure OpenAI recipe generation
 * @param {Object} body - { ingredients, diet?, cuisine?, spice_level?, expiring_ingredients?, cooking_time_max?, top_n? }
 */
export const generateAIRecipe = (body = {}) =>
    api.post('/api/recommendations/generate-recipe', body);

/**
 * Chat with the AI chef about a recipe
 * @param {Object} body - { messages: [{role, content}], recipe_context: {...} }
 */
export const chatAboutRecipe = (body = {}) =>
    api.post('/api/recommendations/chat', body);

/**
 * Chat with the general app assistant
 * @param {Object} body - { messages: [{role, content}] }
 */
export const generalAppChat = (body = {}) =>
    api.post('/api/recommendations/general-chat', body);
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
