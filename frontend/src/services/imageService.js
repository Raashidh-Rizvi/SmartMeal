import axios from 'axios';

const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Free API key from unsplash.com/developers

// Fallback to placeholder if no API key
const PLACEHOLDER_API = 'https://source.unsplash.com/400x300/?';

export const getFoodImage = (foodName) => {
  // Using Unsplash Source (no API key needed)
  return `${PLACEHOLDER_API}${encodeURIComponent(foodName)},food`;
};

// Alternative: Spoonacular API (more accurate food images)
export const getSpoonacularImage = (ingredientName) => {
  return `https://spoonacular.com/cdn/ingredients_100x100/${ingredientName.toLowerCase().replace(' ', '-')}.jpg`;
};

// Alternative: Edamam Food Database (requires free API key)
export const searchFoodImage = async (query) => {
  // Placeholder - returns Unsplash image
  return `https://source.unsplash.com/400x300/?${encodeURIComponent(query)},food`;
};
