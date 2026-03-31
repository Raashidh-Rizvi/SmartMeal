/**
 * Ingredient Utilities for Meal Schedule Integration with Shopping List
 * Handles detection of missing ingredients and shopping list operations
 */

/**
 * Detect missing ingredients for a meal by comparing recipe ingredients
 * against existing shopping list items
 * 
 * @param {Object} recipe - Recipe object with ingredients array
 * @param {number} servings - Number of servings (default 1)
 * @param {Array} shoppingItems - Current shopping list items
 * @returns {Array} Array of missing ingredients with adjusted quantities
 * 
 * Example:
 * const missing = detectMissingIngredients(recipe, 2, existingShoppingItems);
 */
export const detectMissingIngredients = (recipe, servings = 1, shoppingItems = []) => {
  if (!recipe?.ingredients || recipe.ingredients.length === 0) {
    return [];
  }

  return recipe.ingredients
    .map(ing => {
      // Adjust quantity by servings
      const adjustedQuantity = ing.quantity * servings;

      // Check if ingredient already exists in shopping list
      const existingItem = shoppingItems.find(
        item => item.name.toLowerCase() === ing.name.toLowerCase()
      );

      return {
        name: ing.name,
        quantity: adjustedQuantity,
        originalQuantity: ing.quantity, // For reference
        unit: ing.unit || "",
        servings,
        existsInShoppingList: !!existingItem,
        existingQuantity: existingItem?.quantity || 0,
        existingUnit: existingItem?.unit || ""
      };
    })
    .filter(ing => !ing.existsInShoppingList); // Only return missing items
};

/**
 * Check if all recipe ingredients are in the shopping list
 * 
 * @param {Object} recipe - Recipe object
 * @param {Array} shoppingItems - Shopping list items
 * @returns {boolean} True if all ingredients are covered
 */
export const allIngredientsAdded = (recipe, shoppingItems = []) => {
  if (!recipe?.ingredients) return true;
  return recipe.ingredients.every(ing =>
    shoppingItems.some(item => item.name.toLowerCase() === ing.name.toLowerCase())
  );
};

/**
 * Format notes for shopping list item when added from meal
 * 
 * @param {string} recipeTitle - Title of the recipe
 * @param {string} mealDate - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted notes string
 * 
 * Example output: "From Meal: Pasta Carbonara (2026-03-31)"
 */
export const formatMealNotes = (recipeTitle, mealDate) => {
  const date = new Date(mealDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return `From Meal: ${recipeTitle} (${date})`;
};

/**
 * Create shopping list item payload from meal ingredient
 * Uses only ShoppingItemCreate fields (no meal_id, recipe_id, recipe_title)
 * 
 * @param {Object} ingredient - Ingredient object {name, quantity, unit, ...}
 * @param {string} userId - User ID
 * @param {string} recipeTitle - Recipe title for notes
 * @param {string} mealDate - Meal date for notes
 * @returns {Object} Payload ready for /api/shopping/add endpoint
 */
export const buildShoppingItemPayload = (ingredient, userId, recipeTitle, mealDate) => {
  return {
    user_id: userId,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit || "",
    category: "ingredient", // Consistent category for meal-derived items
    notes: formatMealNotes(recipeTitle, mealDate),
    status: "pending"
  };
};

/**
 * Group ingredients by meal for display
 * 
 * @param {Array} meals - Array of meal schedule items
 * @param {Array} recipes - Array of recipe objects
 * @param {Array} shoppingItems - Current shopping list
 * @returns {Object} { mealId: { recipe, missingIngredients } }
 */
export const groupMissingIngredientsByMeal = (meals, recipes, shoppingItems = []) => {
  const grouped = {};

  meals.forEach(meal => {
    const recipe = recipes.find(r => r._id === meal.recipe_id);
    if (!recipe) return;

    const missing = detectMissingIngredients(
      recipe,
      meal.servings || 1,
      shoppingItems
    );

    if (missing.length > 0) {
      grouped[meal._id] = {
        recipe,
        mealDate: meal.meal_date,
        mealType: meal.meal_type,
        servings: meal.servings || 1,
        missingIngredients: missing
      };
    }
  });

  return grouped;
};

/**
 * Calculate progress percentage for a meal's ingredients
 * 
 * @param {number} totalIngredients - Total ingredients in recipe
 * @param {number} missingCount - Count of still-missing ingredients
 * @returns {number} Percentage (0-100)
 */
export const calculateMealProgress = (totalIngredients, missingCount) => {
  if (totalIngredients === 0) return 100;
  return Math.round(((totalIngredients - missingCount) / totalIngredients) * 100);
};
