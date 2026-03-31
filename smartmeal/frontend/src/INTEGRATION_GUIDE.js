/**
 * MEAL SCHEDULE PAGE INTEGRATION GUIDE
 * ====================================
 * 
 * How to integrate missing ingredient detection with Shopping List
 * in your existing MealSchedulePage.jsx
 */

// ─────────────────────────────────────────────────────────────────────────
// STEP 1: ADD IMPORTS AT THE TOP
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMeals, createMeal, updateMeal, deleteMeal } from "../services/mealService";
import { getRecipes } from "../api/recipes";
import { getShoppingItems } from "../services/shoppingService"; // NEW
import { addToShoppingList } from "../services/shoppingService"; // NEW
import {
  detectMissingIngredients,
  buildShoppingItemPayload,
  groupMissingIngredientsByMeal
} from "../utils/ingredientUtils"; // NEW
import MissingIngredientsAlert from "../components/MissingIngredientsAlert"; // NEW
import "../styles/missingIngredients.css"; // NEW
import api from "../api/axios";
import "../styles/MealSchedule.css";


// ─────────────────────────────────────────────────────────────────────────
// STEP 2: ADD STATE VARIABLES IN THE COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function MealSchedulePage() {
  const [meals, setMeals] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [typeRecipes, setTypeRecipes] = useState([]);
  const [form, setForm] = useState({ /* ... existing ... */ });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [viewedMealId, setViewedMealId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  
  // ✅ NEW STATE FOR SHOPPING INTEGRATION
  const [shoppingItems, setShoppingItems] = useState([]);
  const [addingIngredient, setAddingIngredient] = useState(new Set());
  const [addedIngredients, setAddedIngredients] = useState(new Set());
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  
  const navigate = useNavigate();
  const userId = "1"; // Replace with actual user ID from context/auth


// ─────────────────────────────────────────────────────────────────────────
// STEP 3: ADD SHOPPING LIST LOADING FUNCTION
// ─────────────────────────────────────────────────────────────────────────

  /**
   * Load shopping items for missing ingredient detection
   * Run this when meals change or component mounts
   */
  const loadShoppingItems = useCallback(async () => {
    try {
      setIngredientsLoading(true);
      const res = await getShoppingItems(userId);
      setShoppingItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load shopping items:", err);
      setShoppingItems([]);
    } finally {
      setIngredientsLoading(false);
    }
  }, []);


// ─────────────────────────────────────────────────────────────────────────
// STEP 4: LOAD SHOPPING ITEMS ON MOUNT AND WHEN MEALS CHANGE
// ─────────────────────────────────────────────────────────────────────────

  // In your existing useEffect that loads meals:
  useEffect(() => {
    load(); // Your existing load function
    loadShoppingItems(); // ✅ NEW: Load shopping items
  }, []);

  // Also load shopping items when meals update
  useEffect(() => {
    loadShoppingItems();
  }, [meals, loadShoppingItems]);


// ─────────────────────────────────────────────────────────────────────────
// STEP 5: ADD INGREDIENT HANDLING FUNCTION
// ─────────────────────────────────────────────────────────────────────────

  /**
   * Handle adding an ingredient to shopping list
   * Called when user clicks [ + Add ] button on missing ingredient
   */
  const handleAddIngredientToShopping = useCallback(
    async (ingredient, meal) => {
      const recipe = allRecipes.find(r => r._id === meal.recipe_id);
      if (!recipe) {
        toast("Recipe not found", "error");
        return;
      }

      const ingKey = `${meal._id}_${ingredient.name}`;
      setAddingIngredient(prev => new Set([...prev, ingKey]));

      try {
        // Build payload using the utility function
        // This ensures compatibility with ShoppingItemCreate model
        const payload = buildShoppingItemPayload(
          ingredient,
          userId,
          recipe.title,
          meal.meal_date
        );

        // Add to shopping list using the basic endpoint
        await addToShoppingList(payload);

        // Mark as added in UI
        setAddedIngredients(prev => new Set([...prev, ingKey]));

        // Show success toast
        toast(
          `✅ "${ingredient.name}" added to Shopping List!`,
          "success"
        );

        // Refresh shopping items to update missing ingredient detection
        setTimeout(() => {
          loadShoppingItems();
        }, 500);

      } catch (err) {
        const errorMsg = err?.response?.data?.detail || 
                         err?.message || 
                         "Failed to add ingredient";
        toast(`Failed to add "${ingredient.name}": ${errorMsg}`, "error");
      } finally {
        setAddingIngredient(prev => {
          const newSet = new Set(prev);
          newSet.delete(ingKey);
          return newSet;
        });
      }
    },
    [allRecipes, userId, loadShoppingItems]
  );


// ─────────────────────────────────────────────────────────────────────────
// STEP 6: RENDER MISSING INGREDIENTS ALERTS IN YOUR TABLE
// ─────────────────────────────────────────────────────────────────────────

  // In your table render section (e.g., in DailyView, WeeklyView, or List View):
  
  const filtered = meals.filter(m => {
    const name = (m.recipe_title || allRecipes.find(r => r._id === m.recipe_id)?.title || "").toLowerCase();
    const mealStatus = (m.status || "planned").toLowerCase();
    const mealType = (m.meal_type || "").toLowerCase();
    return (
      (!search || name.includes(search.toLowerCase())) &&
      (!filterType || mealType === filterType.toLowerCase()) &&
      (!filterStatus || mealStatus === filterStatus.toLowerCase())
    );
  });

  // Inside your table body (where you render each meal row):
  return (
    <div className="ms-page">
      {/* ... existing code ... */}
      
      {/* Table or List View */}
      <table className="ms-table">
        <tbody>
          {filtered.map(meal => {
            const recipe = allRecipes.find(r => r._id === meal.recipe_id);
            const missing = detectMissingIngredients(
              recipe,
              meal.servings || 1,
              shoppingItems
            );

            return (
              <React.Fragment key={meal._id}>
                {/* Main Row */}
                <tr className="ms-row">
                  <td>{meal.meal_type}</td>
                  <td>{recipe?.title || "Unknown"}</td>
                  <td>{meal.meal_date}</td>
                  <td>
                    {missing.length > 0 && (
                      <span className="ms-missing-badge">
                        ⚠️ {missing.length} missing
                      </span>
                    )}
                  </td>
                  {/* ... other cells ... */}
                </tr>

                {/* Alert Row - Appeared Below Main Row if there are missing ingredients */}
                {missing.length > 0 && (
                  <tr className="ms-alert-row">
                    <td colSpan="100%">
                      <MissingIngredientsAlert
                        meal={meal}
                        recipe={recipe}
                        shoppingItems={shoppingItems}
                        onAddIngredient={handleAddIngredientToShopping}
                        addingInProgress={addingIngredient}
                        addedIngredients={addedIngredients}
                        onRefreshShoppingList={loadShoppingItems}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────
// API PAYLOAD EXAMPLES
// ─────────────────────────────────────────────────────────────────────────

/**
 * When user clicks [ + Add ] on "Sugar" ingredient:
 * 
 * Payload sent to POST /api/shopping/add:
 * {
 *   "user_id": "1",
 *   "name": "Sugar",
 *   "quantity": 2,
 *   "unit": "cups",
 *   "category": "ingredient",
 *   "notes": "From Meal: Chocolate Cake (03/31/2026)",
 *   "status": "pending"
 * }
 * 
 * Response (201 Created):
 * {
 *   "_id": "507f1f77bcf86cd799439011",
 *   "user_id": "1",
 *   "name": "Sugar",
 *   "quantity": 2,
 *   "unit": "cups",
 *   "category": "ingredient",
 *   "notes": "From Meal: Chocolate Cake (03/31/2026)",
 *   "status": "pending",
 *   "created_at": "2026-03-31T10:30:00Z",
 *   "updated_at": "2026-03-31T10:30:00Z"
 * }
 */


// ─────────────────────────────────────────────────────────────────────────
// SHOPPING LIST UI INTEGRATION
// ─────────────────────────────────────────────────────────────────────────

/**
 * In your ShoppingList.jsx component:
 * 
 * The shopping list will automatically display:
 * - Items added from meal schedule: category="ingredient"
 * - User manually added items: any category
 * - Properly merged and deduplicated
 * 
 * To show items grouped by source:
 * 
 *   const mealDerived = shoppingItems.filter(item => item.category === 'ingredient');
 *   const userAdded = shoppingItems.filter(item => item.category !== 'ingredient');
 * 
 * Display them separately if desired, or show all together with
 * notes indicating meal source.
 */

