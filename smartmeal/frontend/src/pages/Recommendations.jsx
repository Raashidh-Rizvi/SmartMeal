import React, { useContext, useRef, useState } from 'react';
import {
  createRecipe,
  getRecipes,
  searchRecommendations,
  toggleFavoriteRecipe,
} from '../api/recipes';
import { createMeal } from '../services/mealService';
import { AuthContext } from '../context/AuthContext';
import {
  CalendarDays,
  ChefHat,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock3,
  Flame,
  Heart,
  Leaf,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import './recommendations.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

const DIET_OPTIONS = [
  { value: '', label: 'Any Diet' },
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non-veg', label: 'Non-Vegetarian' },
];

const QUICK_EXAMPLES = [
  ['chicken', 'rice', 'onion'],
  ['egg', 'tomato', 'garlic'],
  ['potato', 'spinach', 'curry'],
  ['pasta', 'cheese', 'garlic'],
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const STATUS_OPTS = ['planned', 'pending', 'ready', 'bought', 'cooking', 'completed', 'skipped'];

const today = () => new Date().toISOString().slice(0, 10);

const sentenceCase = (value) => {
  const text = String(value || '').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
};

const formatPrepTime = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  const match = text.match(/(\d+)/);
  return match ? `${match[1]} min` : sentenceCase(text);
};

const normalizeIngredients = (values) =>
  values
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const getRecipeImageSrc = (imageUrl) =>
  imageUrl?.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : imageUrl;

const normalizeRecipeKey = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\brecipe\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const dedupeRecommendedRecipes = (items) => {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter((recipe) => {
    const key = normalizeRecipeKey(recipe?.name);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const parseLeadingQuantity = (value) => {
  const fractionMatch = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return Number(fractionMatch[1]) + (Number(fractionMatch[2]) / Number(fractionMatch[3]));
  }

  const simpleFractionMatch = value.match(/^(\d+)\/(\d+)$/);
  if (simpleFractionMatch) {
    return Number(simpleFractionMatch[1]) / Number(simpleFractionMatch[2]);
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const sanitizeIngredientName = (value, fallbackIndex) => {
  const cleaned = String(value || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[,\-:;.\s]+|[,\-:;.\s]+$/g, '')
    .trim();

  const limited = cleaned.slice(0, 100).trim();
  return limited || `Ingredient ${fallbackIndex + 1}`;
};

const toRecipeIngredient = (ingredient, index) => {
  const raw = String(ingredient || '').replace(/\s+/g, ' ').trim();
  if (!raw) {
    return null;
  }

  const quantityUnitMatch = raw.match(/^(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+)\s+([a-zA-Z][a-zA-Z-]{0,49})\s+(.+)$/);
  if (quantityUnitMatch) {
    const quantity = parseLeadingQuantity(quantityUnitMatch[1]);
    const unit = quantityUnitMatch[2].slice(0, 50).toLowerCase();
    const name = sanitizeIngredientName(quantityUnitMatch[3], index);

    if (quantity && name) {
      return { name, quantity, unit };
    }
  }

  return {
    name: sanitizeIngredientName(raw, index),
    quantity: 1,
    unit: 'serving',
  };
};

const buildRecommendationIngredients = (ingredients) =>
  (Array.isArray(ingredients) ? ingredients : [])
    .map((ingredient, index) => toRecipeIngredient(ingredient, index))
    .filter(Boolean)
    .slice(0, 40);

const buildRecommendationSteps = (recipe) => {
  const rawSteps = recipe.instructions
    ? String(recipe.instructions)
      .split(/[.\n]/)
      .map((step) => step.trim())
      .filter(Boolean)
    : [];

  const limitedSteps = rawSteps
    .map((step) => step.slice(0, 1000).trim())
    .filter(Boolean)
    .slice(0, 25);

  return limitedSteps.length > 0
    ? limitedSteps
    : [`Prepare ${recipe.name} using the listed ingredients.`];
};

function Recommendations() {
  const { user, setUser } = useContext(AuthContext);
  const userId = user?.id || user?._id || '1';

  const [inputVal, setInputVal] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [diet, setDiet] = useState('');
  const [timeMax, setTimeMax] = useState('');
  const [topN, setTopN] = useState(5);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({});
  const [imageFailures, setImageFailures] = useState({});
  const inputRef = useRef(null);

  const hasSearchState =
    ingredients.length > 0 ||
    Boolean(inputVal.trim()) ||
    Boolean(diet) ||
    Boolean(timeMax) ||
    topN !== 5;
  const emptyStateTitle = errorMsg ? 'Adjust your search' : 'No matching recipes yet';
  const emptyStateMessage = errorMsg
    ? errorMsg
    : 'Try adding another ingredient or relax one of the filters to widen the search.';

  const appendIngredients = (values) => {
    const normalized = normalizeIngredients(values);
    if (normalized.length === 0) return;

    setIngredients((prev) => {
      const existing = new Set(prev);
      return [...prev, ...normalized.filter((value) => !existing.has(value))];
    });
    setInputVal('');
  };

  const removeIngredient = (idx) =>
    setIngredients((prev) => prev.filter((_, index) => index !== idx));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      appendIngredients([inputVal]);
      return;
    }

    if (e.key === 'Backspace' && !inputVal && ingredients.length > 0) {
      setIngredients((prev) => prev.slice(0, -1));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const pending = normalizeIngredients([inputVal]);
    const finalIngredients = pending.length > 0
      ? [...new Set([...ingredients, ...pending])]
      : ingredients;

    if (pending.length > 0) {
      setIngredients(finalIngredients);
      setInputVal('');
    }

    if (finalIngredients.length === 0) {
      setErrorMsg('Add at least one ingredient to search for recipes.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setRecipes([]);
    setSearched(false);
    setExpandedIdx(null);
    setScheduleForm({});
    setImageFailures({});

    try {
      const response = await searchRecommendations(finalIngredients.join(' '), {
        top_n: topN,
        diet: diet || undefined,
        cooking_time_max: timeMax ? parseInt(timeMax, 10) : undefined,
      });

      if (!response.data.success) {
        setErrorMsg(response.data.message || 'Unable to find recommendations right now.');
      } else {
        setRecipes(dedupeRecommendedRecipes(response.data.recipes));
      }

      setSearched(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to fetch recommendations.');
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearched(false);
    setRecipes([]);
    setIngredients([]);
    setInputVal('');
    setDiet('');
    setTimeMax('');
    setTopN(5);
    setErrorMsg('');
    setExpandedIdx(null);
    setScheduleForm({});
    setImageFailures({});
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const sf = (idx) => scheduleForm[idx] || {};
  const setSF = (idx, patch) =>
    setScheduleForm((prev) => ({ ...prev, [idx]: { ...sf(idx), ...patch } }));

  const markImageFailure = (idx) =>
    setImageFailures((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }));

  const resolveRecipeId = async (recipe, mealType = 'lunch') => {
    const searchRes = await getRecipes({ search: recipe.name, limit: 5 });
    const matches = Array.isArray(searchRes.data) ? searchRes.data : [];
    const targetKey = normalizeRecipeKey(recipe.name);
    const exactMatch = matches.find(
      (item) => normalizeRecipeKey(item.title) === targetKey
    );

    if (exactMatch?._id) {
      return exactMatch._id;
    }
    const ingredientItems = buildRecommendationIngredients(recipe.ingredients);
    const safeIngredients = ingredientItems.length > 0
      ? ingredientItems
      : [{ name: 'Assorted ingredients', quantity: 1, unit: 'serving' }];
    const steps = buildRecommendationSteps(recipe);

    const createdRecipe = await createRecipe({
      title: String(recipe.name || 'AI Recommended Recipe').slice(0, 200).trim(),
      description: `AI-recommended recipe. Cuisine: ${recipe.cuisine || 'N/A'}. Diet: ${recipe.diet || 'N/A'}.`,
      category: mealType,
      ingredients: safeIngredients,
      preparation_steps: steps,
      dietary_tags: recipe.diet && recipe.diet !== 'N/A' ? [recipe.diet] : [],
      estimated_cooking_time: (() => {
        const match = String(recipe.prep_time || '').match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })(),
    });

    return createdRecipe.data._id || createdRecipe.data.id;
  };

  const handleAddToSchedule = async (recipe, idx) => {
    const form = sf(idx);

    if (!form.date) {
      setSF(idx, { error: 'Select a date before saving this meal.' });
      return;
    }

    if (!form.meal_type) {
      setSF(idx, { error: 'Choose a meal type before saving this meal.' });
      return;
    }

    setSF(idx, { scheduleLoading: true, error: null });

    try {
      const recipeId = await resolveRecipeId(recipe, form.meal_type);
      await createMeal({
        user_id: userId,
        recipe_id: recipeId,
        meal_date: form.date,
        meal_type: form.meal_type,
        status: form.status || 'planned',
        description: form.description?.trim() || 'Added from AI Recommendations',
      });

      setSF(idx, { scheduleLoading: false, done: true, error: null, open: false });
      setRecipes((prev) =>
        prev.map((item, recipeIdx) =>
          recipeIdx === idx ? { ...item, _id: recipeId } : item
        )
      );
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to add this recipe to the meal schedule.';
      setSF(idx, {
        scheduleLoading: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      });
    }
  };

  const isFavorited = (recipeId) => {
    if (!user || !Array.isArray(user.favoriteRecipes) || !recipeId) return false;
    return user.favoriteRecipes.some((id) => String(id) === String(recipeId));
  };

  const handleToggleFavorite = async (recipe, idx) => {
    if (!user) {
      setErrorMsg('Please log in to save favorites.');
      return;
    }

    setSF(idx, { favoriteLoading: true, error: null });

    try {
      const recipeId = await resolveRecipeId(recipe);
      const response = await toggleFavoriteRecipe(recipeId);
      const favorites = Array.isArray(response.data?.favorites) ? response.data.favorites : [];

      setUser((prev) => (prev ? { ...prev, favoriteRecipes: favorites } : prev));
      setRecipes((prev) =>
        prev.map((item, recipeIdx) =>
          recipeIdx === idx ? { ...item, _id: recipeId } : item
        )
      );
      setSF(idx, { favoriteLoading: false });
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Unable to update favorites right now.';
      setSF(idx, { favoriteLoading: false, error: message });
    }
  };

  return (
    <div className="main-content recommendations-page">
      <section className="recommendations-hero page-hero page-hero--sub">
        <UtensilsCrossed
          size={44}
          className="hero-sway"
          style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '30%', left: '4%', '--rotation': '-18deg' }}
        />
        <ChefHat
          size={52}
          className="hero-sway"
          style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '26%', left: '34%', '--rotation': '12deg', animationDelay: '0.8s' }}
        />
        <Flame
          size={40}
          className="hero-sway"
          style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', bottom: '18%', left: '18%', '--rotation': '20deg', animationDelay: '1.5s' }}
        />
        <Leaf
          size={48}
          className="hero-sway"
          style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '28%', right: '6%', '--rotation': '-10deg', animationDelay: '2.3s' }}
        />

        <div className="recommendations-hero-badge">
          <Sparkles size={16} />
          Smart Matching
        </div>
        <h1 className="recommendations-title">Recipe Recommendations</h1>
        <p className="recommendations-subtitle">
          Enter the ingredients you have, apply a few filters, and let SmartMeal surface the best matching recipes for your next meal.
        </p>
      </section>

      <section className="recommendations-search-card card">
        <form className="recommendations-search-form" onSubmit={handleSearch}>
          <div className="recommendations-section-heading">
            <div>
              <p className="recommendations-eyebrow">Your Ingredients</p>
              <h2>Build your ingredient list</h2>
            </div>
            {hasSearchState && (
              <button
                type="button"
                className="recommendations-reset-link"
                onClick={handleReset}
              >
                <RefreshCcw size={15} />
                Clear
              </button>
            )}
          </div>

          <div className="recommendations-label-row">
            <span>Add ingredients one by one</span>
            <span>Press Enter or comma to add</span>
          </div>

          <div
            className={`recommendations-tag-field ${errorMsg ? 'is-error' : ''}`}
            onClick={() => inputRef.current?.focus()}
          >
            {ingredients.map((ingredient, idx) => (
              <span key={`${ingredient}-${idx}`} className="recommendations-chip">
                {ingredient}
                <button
                  type="button"
                  className="recommendations-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeIngredient(idx);
                  }}
                  aria-label={`Remove ${ingredient}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}

            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputVal.trim()) appendIngredients([inputVal]);
              }}
              placeholder={ingredients.length === 0 ? 'e.g. chicken, rice, onion' : 'Add another ingredient'}
              className="recommendations-tag-input"
            />
          </div>

          {errorMsg && (
            <div className="recommendations-inline-error">
              <CircleAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="recommendations-quick-examples">
            <span className="recommendations-quick-label">Quick starts</span>
            <div className="recommendations-quick-list">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.join('-')}
                  type="button"
                  className="recommendations-quick-chip"
                  onClick={() => appendIngredients(example)}
                >
                  {example.join(', ')}
                </button>
              ))}
            </div>
          </div>

          <div className="recommendations-section-heading recommendations-section-heading--filters">
            <div>
              <p className="recommendations-eyebrow">Filters</p>
              <h2>Refine the results</h2>
            </div>
            <div className="recommendations-filter-icon">
              <SlidersHorizontal size={16} />
              Search options
            </div>
          </div>

          <div className="recommendations-filter-grid">
            <div className="form-group recommendations-form-group">
              <label htmlFor="recommendation-diet">Dietary Preference</label>
              <select
                id="recommendation-diet"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
              >
                {DIET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group recommendations-form-group">
              <label htmlFor="recommendation-time">Max Preparation Time</label>
              <div className="recommendations-input-with-suffix">
                <input
                  id="recommendation-time"
                  type="number"
                  min="1"
                  value={timeMax}
                  onChange={(e) => setTimeMax(e.target.value)}
                  placeholder="e.g. 30"
                />
                <span>min</span>
              </div>
            </div>

            <div className="form-group recommendations-form-group">
              <label htmlFor="recommendation-topn">Number of Results</label>
              <select
                id="recommendation-topn"
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value, 10))}
              >
                {[3, 5, 8, 10].map((count) => (
                  <option key={count} value={count}>
                    {count} recipes
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="recommendations-search-actions">
            <button type="submit" disabled={loading} className="btn-primary recommendations-search-button">
              <Search size={18} />
              {loading ? 'Searching...' : 'Find Recipes'}
            </button>

            {searched && (
              <button
                type="button"
                className="btn-secondary recommendations-secondary-button"
                onClick={handleReset}
              >
                <RefreshCcw size={16} />
                New Search
              </button>
            )}
          </div>
        </form>
      </section>

      {loading && (
        <section className="recommendations-loading card">
          <div className="recommendations-loading-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <h2>Finding your best matches</h2>
            <p>We're comparing your ingredients against the recipe repository now.</p>
          </div>
        </section>
      )}

      {searched && !loading && (
        <section className="recommendations-results">
          <div className="recommendations-results-bar">
            <div>
              <p className="recommendations-eyebrow">Results</p>
              <h2>
                {recipes.length === 0
                  ? 'No recipes found'
                  : `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} found`}
              </h2>
              {ingredients.length > 0 && (
                <p className="recommendations-results-copy">
                  Matching with: <span>{ingredients.join(', ')}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              className="btn-secondary recommendations-secondary-button"
              onClick={handleReset}
            >
              <RefreshCcw size={16} />
              New Search
            </button>
          </div>

          {recipes.length === 0 ? (
            <div className="recommendations-empty card">
              <ChefHat size={42} />
              <h3>{emptyStateTitle}</h3>
              <p>{emptyStateMessage}</p>
            </div>
          ) : (
            <div className="recommendations-grid">
              {recipes.map((recipe, idx) => {
                const form = sf(idx);
                const isExpanded = expandedIdx === idx;
                const showSchedule = Boolean(form.open);
                const score = Math.round((recipe.similarity_score || 0) * 100);
                const scoreTone =
                  score >= 75 ? 'high' : score >= 45 ? 'medium' : 'low';
                const hasIngredients = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0;
                const recipeId = recipe._id;
                const favoriteLabel = isFavorited(recipeId) ? 'Favorited' : 'Save';
                const prepTime = formatPrepTime(recipe.prep_time);
                const imageFailed = Boolean(imageFailures[idx]);

                return (
                  <article key={`${recipe.name}-${idx}`} className="recommendation-card card">
                    <div className="recommendation-card-media">
                      {recipe.image_url && !imageFailed ? (
                        <img
                          src={getRecipeImageSrc(recipe.image_url)}
                          alt={recipe.name}
                          className="recommendation-card-image"
                          onError={() => markImageFailure(idx)}
                        />
                      ) : (
                        <div className="recommendation-card-image recommendation-card-image--placeholder">
                          <ChefHat size={34} />
                        </div>
                      )}

                      {user && (
                        <button
                          type="button"
                          className={`recommendation-favorite ${isFavorited(recipeId) ? 'is-active' : ''}`}
                          onClick={() => handleToggleFavorite(recipe, idx)}
                          disabled={form.favoriteLoading}
                        >
                          <Heart size={16} fill={isFavorited(recipeId) ? 'currentColor' : 'none'} />
                          <span>{form.favoriteLoading ? 'Saving...' : favoriteLabel}</span>
                        </button>
                      )}
                    </div>

                    <div className="recommendation-card-body">
                      <div className="recommendation-card-header">
                        <div className="recommendation-card-heading">
                          <h3>{recipe.name}</h3>
                          <p>Why it matches</p>
                        </div>

                        <div className={`recommendation-score recommendation-score--${scoreTone}`}>
                          <strong>{score}%</strong>
                          <span>match</span>
                        </div>
                      </div>

                      <div className="recommendation-meta">
                        {recipe.cuisine && (
                          <span className="recommendation-meta-chip">
                            <UtensilsCrossed size={14} />
                            {sentenceCase(recipe.cuisine)}
                          </span>
                        )}
                        {recipe.diet && (
                          <span className="recommendation-meta-chip recommendation-meta-chip--diet">
                            <Leaf size={14} />
                            {sentenceCase(recipe.diet)}
                          </span>
                        )}
                        {prepTime && (
                          <span className="recommendation-meta-chip recommendation-meta-chip--time">
                            <Clock3 size={14} />
                            {prepTime}
                          </span>
                        )}
                      </div>

                      <p className="recommendation-explanation">
                        {recipe.match_explanation || 'Matched on ingredient overlap and the filters you selected.'}
                      </p>

                      {recipe.matched_keywords?.length > 0 && (
                        <div className="recommendation-keywords">
                          {recipe.matched_keywords.map((keyword) => (
                            <span key={keyword} className="recommendation-keyword">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}

                      {form.error && (
                        <div className="recommendation-card-error">
                          <CircleAlert size={16} />
                          <span>{form.error}</span>
                        </div>
                      )}

                      <div className="recommendation-card-actions">
                        <button
                          type="button"
                          className={`btn-secondary recommendation-action-button ${isExpanded ? 'is-active' : ''}`}
                          onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {isExpanded ? 'Hide Ingredients' : 'View Ingredients'}
                        </button>

                        {!form.done ? (
                          <button
                            type="button"
                            className={`btn-secondary recommendation-action-button ${showSchedule ? 'is-active' : ''}`}
                            onClick={() => setSF(idx, { open: !showSchedule, error: null })}
                          >
                            <CalendarDays size={16} />
                            {showSchedule ? 'Close Schedule' : 'Add to Schedule'}
                          </button>
                        ) : (
                          <div className="recommendation-scheduled-pill">
                            <CalendarDays size={15} />
                            Scheduled for {form.date}
                          </div>
                        )}
                      </div>

                      {isExpanded && hasIngredients && (
                        <div className="recommendation-panel">
                          <div className="recommendation-panel-header">
                            <h4>Ingredients</h4>
                            <span>{recipe.ingredients.length} items</span>
                          </div>
                          <ul className="recommendation-ingredient-list">
                            {recipe.ingredients.map((ingredient, ingredientIdx) => (
                              <li key={`${ingredient}-${ingredientIdx}`}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {showSchedule && !form.done && (
                        <div className="recommendation-panel recommendation-panel--schedule">
                          <div className="recommendation-panel-header">
                            <h4>Schedule this recipe</h4>
                            <span>Save it to your meal plan</span>
                          </div>

                          <div className="recommendation-schedule-grid">
                            <div className="form-group recommendations-form-group">
                              <label htmlFor={`schedule-date-${idx}`}>Date</label>
                              <input
                                id={`schedule-date-${idx}`}
                                type="date"
                                min={today()}
                                value={form.date || ''}
                                onChange={(e) => setSF(idx, { date: e.target.value, error: null })}
                              />
                            </div>

                            <div className="form-group recommendations-form-group">
                              <label htmlFor={`schedule-mealtype-${idx}`}>Meal Type</label>
                              <select
                                id={`schedule-mealtype-${idx}`}
                                value={form.meal_type || ''}
                                onChange={(e) => setSF(idx, { meal_type: e.target.value, error: null })}
                              >
                                <option value="">Select type</option>
                                {MEAL_TYPES.map((mealType) => (
                                  <option key={mealType} value={mealType}>
                                    {sentenceCase(mealType)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group recommendations-form-group">
                              <label htmlFor={`schedule-status-${idx}`}>Status</label>
                              <select
                                id={`schedule-status-${idx}`}
                                value={form.status || 'planned'}
                                onChange={(e) => setSF(idx, { status: e.target.value })}
                              >
                                {STATUS_OPTS.map((status) => (
                                  <option key={status} value={status}>
                                    {sentenceCase(status)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="form-group recommendations-form-group">
                            <label htmlFor={`schedule-notes-${idx}`}>Notes</label>
                            <input
                              id={`schedule-notes-${idx}`}
                              type="text"
                              value={form.description || ''}
                              onChange={(e) => setSF(idx, { description: e.target.value })}
                              placeholder="Add a short note for this meal"
                            />
                          </div>

                          <button
                            type="button"
                            className="btn-primary recommendation-schedule-button"
                            onClick={() => handleAddToSchedule(recipe, idx)}
                            disabled={form.scheduleLoading}
                          >
                            <CalendarDays size={16} />
                            {form.scheduleLoading ? 'Saving to Schedule...' : 'Save to Meal Schedule'}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Recommendations;

