<<<<<<< HEAD
import React from 'react';

function Recommendations() {
  return (
    <div className="card">
      <h2>Recipe Recommendations</h2>
      <p className="text-muted">Get smart recipe recommendations based on your profile preferences and available inventory.</p>
      
      <div className="alert alert-success mt-4">
        Feature coming soon!
      </div>
=======
import React, { useContext, useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  createRecipe,
  getRecipes,
  searchRecommendations,
  toggleFavoriteRecipe,
  rateRecipe,
  generateAIRecipe
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
  Star,
  Zap,
  Lightbulb,
  Wand2
} from 'lucide-react';
import AIRecipePanel from '../components/AIRecipePanel';
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
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const userId = user?.id || user?._id || '1';

  const [inputVal, setInputVal] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [diet, setDiet] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [spiceLevel, setSpiceLevel] = useState('');
  const [timeMax, setTimeMax] = useState('');
  const [topN, setTopN] = useState(5);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [navigatingIdx, setNavigatingIdx] = useState(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({});
  const [imageFailures, setImageFailures] = useState({});
  const inputRef = useRef(null);
  const aiPanelRef = useRef(null);

  // ── AI generation state ───────────────────────────────────────────────────
  const [aiData, setAiData]           = useState(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiCardIdx, setAiCardIdx]     = useState(null);

  const hasSearchState =
    ingredients.length > 0 ||
    Boolean(inputVal.trim()) ||
    Boolean(diet) ||
    Boolean(cuisine) ||
    Boolean(spiceLevel) ||
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

  const location = useLocation();

  // Refactored core search logic to allow programmatic invocation
  const executeSearch = async (finalIngredients, overrides = {}) => {
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

    const finalDiet = overrides.diet !== undefined ? overrides.diet : diet;
    const finalTimeMax = overrides.timeMax !== undefined ? overrides.timeMax : timeMax;

    try {
      const response = await searchRecommendations(finalIngredients.join(' '), {
        top_n: topN,
        diet: finalDiet || undefined,
        cooking_time_max: finalTimeMax ? parseInt(finalTimeMax, 10) : undefined,
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

    executeSearch(finalIngredients);
  };

  // Auto-trigger search if query param 'q' is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && !searched && !loading && ingredients.length === 0) {
      let remainingQuery = q.toLowerCase();
      let extractedDiet = '';
      let extractedTime = '';
      let extractedCuisine = '';
      let extractedSpice = '';

      // Extract Diet
      if (remainingQuery.includes('non-veg')) {
        extractedDiet = 'non-veg';
        remainingQuery = remainingQuery.replace('non-veg', '');
      } else if (remainingQuery.includes('veg') || remainingQuery.includes('vegetarian')) {
        extractedDiet = 'veg';
        remainingQuery = remainingQuery.replace('vegetarian', '').replace('veg', '');
      }

      // Extract Time
      const timeMatch = remainingQuery.match(/(\d+)\s*(min|minutes|m)/);
      if (timeMatch) {
        extractedTime = timeMatch[1];
        remainingQuery = remainingQuery.replace(timeMatch[0], '');
      } else if (remainingQuery.includes('quick') || remainingQuery.includes('fast')) {
        extractedTime = '30';
        remainingQuery = remainingQuery.replace('quick', '').replace('fast', '');
      }

      // Extract Cuisine
      const cuisinesList = ['indian', 'italian', 'chinese', 'mexican', 'american', 'thai', 'japanese', 'mediterranean'];
      for (const c of cuisinesList) {
        if (remainingQuery.includes(c)) {
          extractedCuisine = sentenceCase(c);
          remainingQuery = remainingQuery.replace(c, '');
          break;
        }
      }

      // Extract Spice
      const spiceList = ['mild', 'medium', 'spicy', 'hot'];
      for (const s of spiceList) {
        if (remainingQuery.includes(s)) {
          extractedSpice = sentenceCase(s);
          remainingQuery = remainingQuery.replace(s, '');
          break;
        }
      }

      // Clean up common stop words/meal types so they don't pollute ingredients
      const stopWords = ['breakfast', 'lunch', 'dinner', 'snack', 'meal', 'recipe', 'for', 'with', 'and', 'make', 'cook'];
      for (const w of stopWords) {
        remainingQuery = remainingQuery.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
      }

      const items = remainingQuery.split(/\s+/).filter(Boolean);
      const finalItems = items.length > 0 ? items : ['recipe']; // Provide fallback if everything was filtered

      // Update state so the UI reflects the filters
      if (extractedDiet) setDiet(extractedDiet);
      if (extractedTime) setTimeMax(extractedTime);
      if (extractedCuisine) setCuisine(extractedCuisine);
      if (extractedSpice) setSpiceLevel(extractedSpice);
      setIngredients(finalItems);

      // Execute search with overrides since state updates are async
      executeSearch(finalItems, { diet: extractedDiet, timeMax: extractedTime });
      
      // Remove query param to prevent loops
      navigate('/recommendations', { replace: true });
    }
  }, [location.search]);

  const handleReset = () => {
    setSearched(false);
    setRecipes([]);
    setIngredients([]);
    setInputVal('');
    setDiet('');
    setCuisine('');
    setSpiceLevel('');
    setTimeMax('');
    setTopN(5);
    setErrorMsg('');
    setExpandedIdx(null);
    setScheduleForm({});
    setImageFailures({});
    setAiData(null);
    setAiCardIdx(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── AI generation handler ─────────────────────────────────────────────────
  const handleGenerateRecipe = async (recipeNameHint, cardIdx) => {
    if (ingredients.length === 0) return;
    setAiLoading(true);
    setAiData(null);
    setAiCardIdx(cardIdx);

    // Scroll to the AI recipe panel
    setTimeout(() => {
      if (aiPanelRef.current) {
        aiPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    try {
      const res = await generateAIRecipe({
        ingredients: ingredients.join(', '),
        diet: diet || undefined,
        cuisine: cuisine || recipeNameHint || undefined,
        spice_level: spiceLevel || undefined,
        cooking_time_max: timeMax ? parseInt(timeMax) : undefined,
        top_n: topN,
      });
      setAiData(res.data);
    } catch (err) {
      setAiData({ error: true, message: err.response?.data?.detail || 'AI generation failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAlternativeClick = (altName) => {
    handleGenerateRecipe(altName, null);
  };

  const handleRating = async (recipeId, rating, idx) => {
    if (!recipeId) return;
    try {
      await rateRecipe(recipeId, rating);
      setRecipes(prev => prev.map((r, i) => i === idx ? { ...r, _userRating: rating } : r));
    } catch { /* silent */ }
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

  const handleRecipeClick = async (recipe, idx) => {
    setNavigatingIdx(idx);
    try {
      const recipeId = await resolveRecipeId(recipe);
      navigate(`/recipes/${recipeId}`);
    } catch (err) {
      setErrorMsg('Failed to open recipe details.');
    } finally {
      setNavigatingIdx(null);
    }
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
        {/* Premium Decorative Background Icons - Scattered Artistically */}
        <UtensilsCrossed size={70} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '15%', left: '5%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <ChefHat size={82} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '75%', left: '25%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <Flame size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '20%', left: '10%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <Leaf size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '10%', right: '15%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        
        <Star size={62} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '55%', right: '5%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <Wand2 size={66} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '15%', right: '12%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <Sparkles size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '35%', right: '28%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <Lightbulb size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '35%', left: '22%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <Wand2 size={48} color="#10b981" strokeWidth={1.75} style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="recommendations-hero-badge" style={{ margin: '0 auto 1rem auto', display: 'flex', width: 'fit-content' }}>
            <Sparkles size={16} />
            Smart Matching
          </div>
          <h1 className="recommendations-title" style={{ textAlign: 'center' }}>Recipe Recommendations</h1>
          <p className="recommendations-subtitle" style={{ textAlign: 'center', margin: '0.5rem auto 0 auto' }}>
            Enter the ingredients you have, apply a few filters, and let SmartMeal surface the best matching recipes for your next meal.
          </p>
        </div>
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
              <label htmlFor="recommendation-cuisine">Cuisine</label>
              <input
                id="recommendation-cuisine"
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g. Indian, Italian"
              />
            </div>

            <div className="form-group recommendations-form-group">
              <label htmlFor="recommendation-spice">Spice Level</label>
              <select
                id="recommendation-spice"
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(e.target.value)}
              >
                <option value="">Any</option>
                <option value="mild">🟢 Mild</option>
                <option value="medium">🟡 Medium</option>
                <option value="hot">🔴 Hot</option>
              </select>
            </div>

            <div className="form-group recommendations-form-group">
              <label htmlFor="recommendation-time">Max Prep Time</label>
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

      {ingredients.length > 0 && !loading && (
        <div ref={aiPanelRef} style={{ marginBottom: '2.5rem', animation: 'slideUp 0.4s ease-out' }}>
          {!aiLoading && !aiData && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '20px',
              padding: '1.5rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', flexShrink: 0 }}>
                  <ChefHat size={24} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>Generate a Full AI Recipe</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Get step-by-step instructions, missing ingredients & a shopping list powered by Azure AI</div>
                </div>
              </div>
              <button
                onClick={() => handleGenerateRecipe(ingredients[0], null)}
                style={{
                  padding: '0.85rem 2rem', borderRadius: '50px', fontWeight: 800, fontSize: '0.95rem',
                  background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none',
                  cursor: 'pointer', boxShadow: '0 4px 18px rgba(16,185,129,0.4)', transition: 'all 0.25s',
                  whiteSpace: 'nowrap',
                  width: 'auto',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Sparkles size={16} style={{display:'inline-block', verticalAlign:'middle', marginRight:'6px'}}/> Generate AI Recipe
              </button>
            </div>
          )}

          <AIRecipePanel
            data={aiData}
            loading={aiLoading}
            onAlternativeClick={handleAlternativeClick}
          />
        </div>
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
                    <div className="recommendation-card-media"
                         onClick={() => handleRecipeClick(recipe, idx)}
                         style={{ cursor: 'pointer', position: 'relative' }}>
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

                      {navigatingIdx === idx && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '20px 20px 0 0' }}>
                          <Sparkles size={24} color="var(--primary)" style={{ animation: 'spin 2s linear infinite' }} />
                        </div>
                      )}

                      {user && (
                        <button
                          type="button"
                          className={`recommendation-favorite ${isFavorited(recipeId) ? 'is-active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleToggleFavorite(recipe, idx); }}
                          disabled={form.favoriteLoading}
                        >
                          <Heart size={16} fill={isFavorited(recipeId) ? 'currentColor' : 'none'} />
                          <span>{form.favoriteLoading ? 'Saving...' : favoriteLabel}</span>
                        </button>
                      )}
                    </div>

                    <div className="recommendation-card-body">
                      <div className="recommendation-card-header">
                        <div className="recommendation-card-heading"
                             onClick={() => handleRecipeClick(recipe, idx)}
                             style={{ cursor: 'pointer' }}>
                          <h3 style={{ textDecoration: 'none' }}
                              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                            {recipe.name}
                          </h3>
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
                            <Sparkles size={12} style={{marginRight: '4px', verticalAlign: 'middle', display: 'inline-block'}}/> {keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Star Rating Overlay */}
                    <div style={{ display: 'flex', gap: '0.25rem', paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--card-border)' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => handleRating(recipe._id, star, idx)}
                          style={{
                            cursor: recipe._id ? 'pointer' : 'default', fontSize: '1.25rem',
                            color: star <= (recipe._userRating || 0) ? '#f59e0b' : 'rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            transform: star <= (recipe._userRating || 0) ? 'scale(1.1)' : 'scale(1)'
                          }}>★</span>
                      ))}
                    </div>

                      {form.error && (
                        <div className="recommendation-card-error">
                          <CircleAlert size={16} />
                          <span>{form.error}</span>
                        </div>
                      )}

                      <div className="recommendation-card-actions">
                        <button
                          type="button"
                          className="recommendation-action-button"
                          onClick={() => handleGenerateRecipe(recipe.name, idx)}
                          disabled={aiLoading && aiCardIdx === idx}
                          style={{
                            background: aiCardIdx === idx && (aiLoading || aiData) ? 'var(--primary-gradient)' : 'rgba(16, 185, 129, 0.1)',
                            color: aiCardIdx === idx && (aiLoading || aiData) ? '#fff' : 'var(--primary)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            justifyContent: 'center'
                          }}
                        >
                          <Sparkles size={16} />
                          {aiLoading && aiCardIdx === idx ? 'Generating...' : 'AI Recipe'}
                        </button>
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    </div>
  );
}

export default Recommendations;
<<<<<<< HEAD
=======

>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
