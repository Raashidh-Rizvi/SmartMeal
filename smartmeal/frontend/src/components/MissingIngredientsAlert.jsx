import React, { useState } from "react";
import { detectMissingIngredients, formatMealNotes, calculateMealProgress } from "../utils/ingredientUtils";

/**
 * MissingIngredientsAlert Component
 * Displays meal-specific missing ingredients with individual add buttons
 * 
 * Props:
 * - meal: Meal schedule item {_id, recipe_id, meal_date, meal_type, servings, ...}
 * - recipe: Recipe object {_id, title, category, ingredients: [...]}
 * - shoppingItems: Current shopping list items
 * - onAddIngredient: Callback(ingredient, meal) when user clicks Add
 * - addingInProgress: Set of ingredient keys currently being added
 * - addedIngredients: Set of ingredient keys already added
 * - onRefreshShoppingList: Callback to refresh shopping list data
 */
export default function MissingIngredientsAlert({
  meal,
  recipe,
  shoppingItems = [],
  onAddIngredient,
  addingInProgress = new Set(),
  addedIngredients = new Set(),
  onRefreshShoppingList
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!recipe) {
    return null;
  }

  // Detect missing ingredients
  const missingIng = detectMissingIngredients(recipe, meal.servings || 1, shoppingItems);

  // If no missing ingredients, don't show alert
  if (missingIng.length === 0) {
    return null;
  }

  // Calculate progress
  const totalIng = recipe.ingredients?.length || 0;
  const progress = calculateMealProgress(totalIng, missingIng.length);
  const mealLabel = meal.meal_type ? meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1) : "Meal";

  // Create unique key for tracking ingredient state
  const getIngKey = (ingName) => `${meal._id}_${ingName}`;

  return (
    <div className="missing-ing-alert">
      {/* Alert Header */}
      <div className="missing-ing-header">
        <div className="missing-ing-title-row">
          <h4 className="missing-ing-title">
            ⚠️ {mealLabel} on {new Date(meal.meal_date).toLocaleDateString()} - {recipe.title}
          </h4>
          <button
            className="missing-ing-collapse-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="missing-ing-progress-bar">
          <div
            className="missing-ing-progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span className="missing-ing-progress-text">
            {totalIng - missingIng.length}/{totalIng} ingredients
          </span>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="missing-ing-content">
          <p className="missing-ing-subtitle">
            Missing ({missingIng.length}):
          </p>

          {/* Ingredient List */}
          <ul className="missing-ing-list">
            {missingIng.map((ing) => {
              const ingKey = getIngKey(ing.name);
              const isAdding = addingInProgress.has(ingKey);
              const isAdded = addedIngredients.has(ingKey);

              return (
                <li key={ing.name} className={`missing-ing-item ${isAdded ? "is-added" : ""}`}>
                  {/* Ingredient Details */}
                  <div className="missing-ing-item-left">
                    <span className="missing-ing-name">{ing.name}</span>
                    <span className="missing-ing-qty">
                      {ing.quantity} {ing.unit}
                    </span>
                    {meal.servings && meal.servings > 1 && (
                      <span className="missing-ing-servings" title="Adjusted for servings">
                        ({meal.servings}x serving)
                      </span>
                    )}
                  </div>

                  {/* Add Button */}
                  <button
                    className={`missing-ing-btn ${isAdding ? "is-loading" : ""} ${isAdded ? "is-done" : ""}`}
                    onClick={() => onAddIngredient(ing, meal)}
                    disabled={isAdding || isAdded}
                    title={
                      isAdded
                        ? "Added to shopping list"
                        : isAdding
                        ? "Adding..."
                        : `Add ${ing.name} to shopping list`
                    }
                  >
                    {isAdded ? "✅ Added" : isAdding ? "⟳ Adding..." : "+ Add"}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Helper Text */}
          <div className="missing-ing-helper">
            <p>
              💡 Tip: Add ingredients one at a time. They'll appear in your Shopping List
              automatically. Continue adding until all are checked off!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
