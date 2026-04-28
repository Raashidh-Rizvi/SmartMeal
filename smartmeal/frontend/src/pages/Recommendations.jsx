import React, { useState, useRef, useContext } from 'react';
import { searchRecommendations, rateRecipe, getRecipes, createRecipe, toggleFavoriteRecipe, generateAIRecipe } from '../api/recipes';
import { createMeal } from '../services/mealService';
import { AuthContext } from '../context/AuthContext';
import { Heart, Star, Sparkles, Zap, Lightbulb, UtensilsCrossed, ChefHat, Flame, Leaf, Wand2 } from 'lucide-react';
import AIRecipePanel from '../components/AIRecipePanel';

const DIET_OPTIONS = [
  { value: '', label: 'Any Diet' },
  { value: 'veg', label: '🥦 Vegetarian' },
  { value: 'non-veg', label: '🍗 Non-Vegetarian' },
];

const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner', 'snack'];
const STATUS_OPTS = ['planned', 'pending', 'ready', 'bought', 'cooking', 'completed', 'skipped'];

// ── helpers ──────────────────────────────────────────────────────────────────
const scoreColor = (s) => s >= 0.5 ? 'var(--primary)' : s >= 0.25 ? '#f59e0b' : 'var(--text-muted)';
const today = () => new Date().toISOString().slice(0, 10);

function Recommendations() {
  const { user, setUser } = useContext(AuthContext);
  const userId   = user?.id || user?._id || '1';

  // ── search state ──────────────────────────────────────────────────────────
  const [inputVal, setInputVal]       = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [diet, setDiet]               = useState('');
  const [cuisine, setCuisine]         = useState('');
  const [spiceLevel, setSpiceLevel]   = useState('');
  const [timeMax, setTimeMax]         = useState('');
  const [topN, setTopN]               = useState(5);
  const [recipes, setRecipes]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const inputRef = useRef(null);

  // ── AI generation state ───────────────────────────────────────────────────
  const [aiData, setAiData]           = useState(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiCardIdx, setAiCardIdx]     = useState(null);

  // ── per-card schedule state: { [idx]: { open, date, meal_type, status, description, loading, done, error } }
  const [scheduleForm, setScheduleForm] = useState({});

  // ── ingredient tag helpers ────────────────────────────────────────────────
  const addIngredient = (raw) => {
    const parts = raw.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
    setIngredients(prev => {
      const existing = new Set(prev);
      return [...prev, ...parts.filter(p => !existing.has(p))];
    });
    setInputVal('');
  };

  const removeIngredient = (idx) => setIngredients(prev => prev.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addIngredient(inputVal); }
    else if (e.key === 'Backspace' && !inputVal && ingredients.length > 0)
      setIngredients(prev => prev.slice(0, -1));
  };

  // ── search ────────────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    const pending = inputVal.trim();
    let finalIng = ingredients;
    if (pending) {
      const parts = pending.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
      finalIng = [...new Set([...ingredients, ...parts])];
      setIngredients(finalIng);
      setInputVal('');
    }
    if (finalIng.length === 0) { setErrorMsg('Please add at least one ingredient.'); return; }
    setErrorMsg(''); setLoading(true); setRecipes([]); setSearched(false);
    setExpandedIdx(null); setScheduleForm({});
    try {
      const res = await searchRecommendations(finalIng.join(' '), {
        top_n: topN,
        diet: diet || undefined,
        cooking_time_max: timeMax ? parseInt(timeMax) : undefined,
      });
      if (!res.data.success) setErrorMsg(res.data.message);
      else setRecipes(res.data.recipes);
      setSearched(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to fetch recommendations.');
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setSearched(false); setRecipes([]); setIngredients([]);
    setInputVal(''); setErrorMsg(''); setScheduleForm({});
    setAiData(null); setAiCardIdx(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── AI generation handler ─────────────────────────────────────────────────
  const handleGenerateRecipe = async (recipeNameHint, cardIdx) => {
    if (ingredients.length === 0) return;
    setAiLoading(true);
    setAiData(null);
    setAiCardIdx(cardIdx);
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

  // ── schedule helpers ──────────────────────────────────────────────────────
  const sf = (idx) => scheduleForm[idx] || {};
  const setSF = (idx, patch) =>
    setScheduleForm(prev => ({ ...prev, [idx]: { ...sf(idx), ...patch } }));

  // Find existing recipe in MongoDB or auto-create it from AI data
  const resolveRecipeId = async (r, idx) => {
    // If it already has an _id from enriched backend (most reliable)
    if (r._id) return r._id;

    const normalizedName = String(r.name || '').trim().toLowerCase().replace(/\s+/g, ' ');

    try {
      // Search by title with better matching
      const searchRes = await getRecipes({ search: r.name, limit: 10 });
      const matched = (searchRes.data || []).find(rec => {
        const dbTitle = String(rec.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
        return dbTitle === normalizedName;
      });
      
      if (matched) return matched._id || matched.id;

      // Auto-create from AI data
      const ingredients = (r.ingredients || []).map(ing => {
        const parts = String(ing).trim().split(' ');
        const qty = parseFloat(parts[0]);
        if (!isNaN(qty) && parts.length >= 3) {
          return { 
            name: parts.slice(2).join(' ').slice(0, 100), 
            quantity: qty, 
            unit: parts[1].slice(0, 50) 
          };
        }
        return { 
          name: String(ing).trim().slice(0, 100), 
          quantity: 1, 
          unit: 'serving' 
        };
      }).filter(i => i.name);

      const steps = r.instructions
        ? String(r.instructions).split(/[.\n]/).map(s => s.trim()).filter(Boolean)
        : [`Prepare ${r.name} using the listed ingredients.`];

      const mealType = sf(idx)?.meal_type || 'lunch';
      const newRecipe = await createRecipe({
        title: String(r.name).slice(0, 200),
        description: `AI-recommended recipe. Cuisine: ${r.cuisine || 'N/A'}. Diet: ${r.diet || 'N/A'}.`.slice(0, 2000),
        category: mealType,
        ingredients,
        preparation_steps: steps.map(s => s.slice(0, 1000)).slice(0, 50),
        dietary_tags: r.diet && r.diet !== 'N/A' ? [String(r.diet).slice(0, 50)] : [],
        estimated_cooking_time: (() => {
          const m = String(r.prep_time || '').match(/(\d+)/);
          return m ? parseInt(m[1]) : null;
        })(),
      });
      return newRecipe.data.id || newRecipe.data._id;
    } catch (err) {
      if (err.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw err;
    }
  };

  const handleAddToSchedule = async (r, idx) => {
    const form = sf(idx);
    if (!form.date)      { setSF(idx, { error: 'Please select a date.' }); return; }
    if (!form.meal_type) { setSF(idx, { error: 'Please select a meal type.' }); return; }

    setSF(idx, { loading: true, error: null });
    try {
      const recipeId = await resolveRecipeId(r, idx);
      await createMeal({
        user_id:     userId,
        recipe_id:   recipeId,
        meal_date:   form.date,
        meal_type:   form.meal_type,
        status:      form.status || 'planned',
        description: form.description?.trim() || `Added from AI Recommendations`,
      });
      setSF(idx, { loading: false, done: true, error: null });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add to meal schedule.';
      setSF(idx, { loading: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    }
  };

  const isFavorited = (r) => {
    if (!user || !user.favoriteRecipes) return false;
    const id = r._id || r.id;
    if (id && user.favoriteRecipes.includes(id)) return true;
    // Fallback for enriched results from backend
    if (r.is_favorited) return true;
    return false;
  };

  const handleToggleFavorite = async (r, idx) => {
    if (!user) {
      setErrorMsg('Please log in to save favorites.');
      return;
    }
    if (sf(idx).loading) return; // Prevent double clicks
    
    setSF(idx, { loading: true, error: null });
    try {
      // First ensure the recipe exists in our DB to get a real ID
      const recipeId = await resolveRecipeId(r, idx);
      const res = await toggleFavoriteRecipe(recipeId);
      const newFavorites = res.data.favorites;
      
      // Update global user state
      setUser(prev => ({ ...prev, favoriteRecipes: newFavorites }));
      
      // Update the local recipes state so the heart icon updates immediately
      setRecipes(prev => prev.map((item, i) => i === idx ? { 
        ...item, 
        _id: recipeId, 
        is_favorited: newFavorites.includes(recipeId) 
      } : item));
      
      setSF(idx, { loading: false });
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Error toggling favorite';
      console.error('Error toggling favorite:', err);
      setSF(idx, { loading: false, error: errMsg });
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="main-content">
      {/* Header */}
      <div className="page-hero page-hero--sub">
        {/* Premium Decorative Background Icons - Scattered Artistically */}
        <UtensilsCrossed size={64} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '25%', left: '8%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <ChefHat size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.04, color: '#10b981', pointerEvents: 'none', top: '65%', left: '4%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <Flame size={48} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '20%', left: '12%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <Leaf size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '20%', right: '8%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        <Star size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.04, color: '#10b981', pointerEvents: 'none', bottom: '15%', right: '12%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <Wand2 size={48} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '60%', right: '6%', '--rotation': '30deg', animationDelay: '0.4s' }} />

        <h1 className="premium-gradient-text" style={{ position: 'relative', zIndex: 1, fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>
          AI Recipe Recommendations
        </h1>
        <p style={{ position: 'relative', zIndex: 1, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Discover culinary masterpieces with your available ingredients. Our AI finds recipes that harmonize perfectly.
        </p>
      </div>

      {/* Search form */}
      <div className="card" style={{ padding: '2rem', marginBottom: '3rem', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
        <form onSubmit={handleSearch}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span>YOUR INGREDIENTS</span>
              <span style={{ fontWeight: 400, fontSize: '0.75rem', opacity: 0.7 }}>
                Press Enter or comma to add
              </span>
            </label>

            {/* Tag box */}
            <div onClick={() => inputRef.current?.focus()} style={{
              display: 'flex', flexWrap: 'wrap', gap: '0.6rem',
              padding: '0.75rem 1rem', minHeight: '56px',
              border: `1px solid ${errorMsg ? 'var(--danger)' : 'var(--card-border)'}`,
              borderRadius: '16px', background: 'rgba(255,255,255,0.4)', cursor: 'text', alignItems: 'center',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              {ingredients.map((ing, i) => (
                <span key={i} className="badge" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.85rem',
                  background: 'var(--primary-gradient)', color: '#fff',
                  boxShadow: '0 4px 10px var(--primary-glow)',
                  fontWeight: 600,
                  animation: 'slideUp 0.3s ease-out'
                }}>
                  {ing}
                  <span onClick={e => { e.stopPropagation(); removeIngredient(i); }}
                    style={{ cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', marginLeft: '0.2rem', lineHeight: 1 }}>×</span>
                </span>
              ))}
              <input ref={inputRef} type="text" value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => { if (inputVal.trim()) addIngredient(inputVal); }}
                placeholder={ingredients.length === 0 ? 'e.g. chicken, rice, onion…' : 'Add more…'}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '1rem', color: 'var(--text-main)', flex: '1', minWidth: '150px', padding: '0.2rem 0' }}
              />
            </div>

            {errorMsg && <span style={{ fontSize: '0.82rem', color: 'var(--danger)', marginTop: '0.5rem', display: 'block', fontWeight: 500 }}>{errorMsg}</span>}

            {/* Quick examples */}
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try:</span>
              {['chicken rice onion', 'egg tomato garlic', 'potato spinach curry', 'pasta cheese garlic'].map(ex => (
                <button key={ex} type="button"
                  onClick={() => ex.split(' ').forEach(w => addIngredient(w))}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '50px', width: 'auto' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Dietary Preference</label>
              <select value={diet} onChange={e => setDiet(e.target.value)} style={{ borderRadius: '12px' }}>
                {DIET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Cuisine</label>
              <input type="text" value={cuisine} onChange={e => setCuisine(e.target.value)}
                placeholder="e.g. Indian, Italian" style={{ borderRadius: '12px' }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Spice Level</label>
              <select value={spiceLevel} onChange={e => setSpiceLevel(e.target.value)} style={{ borderRadius: '12px' }}>
                <option value="">Any</option>
                <option value="mild">🟢 Mild</option>
                <option value="medium">🟡 Medium</option>
                <option value="hot">🔴 Hot</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Max Prep Time</label>
              <div style={{ position: 'relative' }}>
                <input type="number" min="1" value={timeMax} onChange={e => setTimeMax(e.target.value)} placeholder="e.g. 30" style={{ borderRadius: '12px', paddingRight: '3rem' }} />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>min</span>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Number of Results</label>
              <select value={topN} onChange={e => setTopN(parseInt(e.target.value))} style={{ borderRadius: '12px' }}>
                {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} recipes</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary"
              style={{ padding: '1.1rem 2rem', boxShadow: 'var(--shadow-premium)' }}>
              {loading ? 'Searching…' : '✨ Find Recipes'}
            </button>
          </div>
        </form>
      </div>

      {loading && <p className="loading">Finding best matches for your ingredients…</p>}

      {/* ── AI Generation CTA + Panel (always visible when ingredients exist) ── */}
      {ingredients.length > 0 && !loading && (
        <div style={{ marginBottom: '2.5rem', animation: 'slideUp 0.4s ease-out' }}>
          {/* CTA Banner */}
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
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Get step-by-step instructions, missing ingredients &amp; a shopping list powered by Azure AI</div>
                </div>
              </div>
              <button
                onClick={() => handleGenerateRecipe(ingredients[0], null)}
                style={{
                  padding: '0.85rem 2rem', borderRadius: '50px', fontWeight: 800, fontSize: '0.95rem',
                  background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none',
                  cursor: 'pointer', boxShadow: '0 4px 18px rgba(16,185,129,0.4)', transition: 'all 0.25s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                ✨ Generate AI Recipe
              </button>
            </div>
          )}

          {/* AI Panel */}
          <AIRecipePanel
            data={aiData}
            loading={aiLoading}
            onAlternativeClick={handleAlternativeClick}
          />
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div style={{ animation: 'slideUp 0.5s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.75rem', fontWeight: 800 }}>
                {recipes.length === 0 ? 'No recipes found' : `${recipes.length} ${recipes.length > 1 ? 'Recipes' : 'Recipe'} Found`}
              </h2>
              {ingredients.length > 0 && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Ingredients: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{ingredients.join(', ')}</span>
                </p>
              )}
            </div>
            <button className="btn-secondary" onClick={handleReset}
              style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.9rem', borderRadius: '12px' }}>
              ← New Search
            </button>
          </div>

          {recipes.length === 0 ? (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '28px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👩‍🍳</div>
              <p style={{ fontSize: '1.1rem' }}>No recipes matched your selection. Try adding more ingredients or broadening your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
              {recipes.map((r, i) => {
                const isExpanded = expandedIdx === i;
                const form       = sf(i);
                const showSched  = !!form.open;
                const score      = Math.round(r.similarity_score * 100);

                return (
                  <div key={i} className="card" style={{
                    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                    border: '1px solid var(--card-border)', background: 'var(--card-bg)',
                    borderRadius: '28px', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                    
                    {/* Recipe Image Banner */}
                    {r.image_url && (
                      <div style={{
                        width: '100%', height: '200px', borderRadius: '16px', overflow: 'hidden',
                        marginBottom: '0.5rem', position: 'relative'
                      }}>
                        <img 
                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${r.image_url}`} 
                          alt={r.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Header: Name + Match Score Badge & Favorite */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: 1.3 }}>{r.name}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                        <div style={{
                          padding: '4px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '50px',
                          display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.75rem'
                        }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            fontSize: '0.75rem', fontWeight: 900
                          }}>
                            {score}%
                          </div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Match
                          </div>
                        </div>

                        {user && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <button 
                              onClick={() => handleToggleFavorite(r, i)}
                              disabled={sf(i).loading}
                              style={{ 
                                background: 'transparent', border: 'none', cursor: sf(i).loading ? 'default' : 'pointer', padding: '4px',
                                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600,
                                color: isFavorited(r) ? '#ef4444' : 'var(--text-muted)',
                                transition: 'all 0.2s ease',
                                opacity: sf(i).loading ? 0.6 : 1
                              }}
                            >
                              <Heart 
                                size={18} 
                                strokeWidth={2.5} 
                                fill={isFavorited(r) ? 'currentColor' : 'none'} 
                                className={sf(i).loading ? 'animate-pulse' : ''}
                              />
                              {sf(i).loading ? 'Saving...' : isFavorited(r) ? 'Favorited' : 'Add to Favorites'}
                            </button>
                            {sf(i).error && !sf(i).open && (
                              <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '2px' }}>
                                {sf(i).error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badges Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {r.cuisine   && <span className="source-badge" style={{ fontSize: '0.75rem' }}>🌍 {r.cuisine}</span>}
                      {r.diet      && <span className="source-badge" style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>🥦 {r.diet}</span>}
                      {r.prep_time && r.prep_time !== '' && (
                        <span className="source-badge" style={{ fontSize: '0.75rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>⏱ {r.prep_time}</span>
                      )}
                    </div>

                    {/* Matched keywords */}
                    {r.matched_keywords?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {r.matched_keywords.map(kw => (
                          <span key={kw} style={{
                            fontSize: '0.7rem', background: 'rgba(var(--primary-rgb), 0.08)',
                            color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '50px',
                            border: '1px solid rgba(var(--primary-rgb), 0.15)', fontWeight: 600
                          }}>
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Explanation */}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{r.match_explanation}"
                    </p>

                    {/* Star Rating Overlay */}
                    <div style={{ display: 'flex', gap: '0.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--card-border)' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => handleRating(r._id, star, i)}
                          style={{
                            cursor: r._id ? 'pointer' : 'default', fontSize: '1.25rem',
                            color: star <= (r._userRating || 0) ? '#f59e0b' : 'rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            transform: star <= (r._userRating || 0) ? 'scale(1.1)' : 'scale(1)'
                          }}>★</span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setExpandedIdx(isExpanded ? null : i)}
                        className={isExpanded ? 'btn-primary' : 'btn-secondary'}
                        style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '12px' }}>
                        {isExpanded ? '▲ Hide Info' : '🥘 View Ingredients'}
                      </button>

                      {/* ✨ AI Generate button */}
                      <button
                        onClick={() => handleGenerateRecipe(r.name, i)}
                        disabled={aiLoading && aiCardIdx === i}
                        style={{
                          width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '12px',
                          background: aiCardIdx === i && (aiLoading || aiData) ? 'var(--primary-gradient)' : 'rgba(var(--primary-rgb),0.08)',
                          color: aiCardIdx === i && (aiLoading || aiData) ? '#fff' : 'var(--primary)',
                          border: '1px solid rgba(var(--primary-rgb),0.25)',
                          fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s'
                        }}>
                        {aiLoading && aiCardIdx === i ? '⏳ Generating…' : '✨ AI Recipe'}
                      </button>

                      {!form.done ? (
                        <button onClick={() => setSF(i, { open: !showSched, error: null })}
                          className="btn-secondary"
                          style={{
                            width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '12px',
                            borderColor: showSched ? '#3b82f6' : 'var(--card-border)',
                            color: showSched ? '#3b82f6' : 'var(--text-main)',
                            background: showSched ? 'rgba(59,130,246,0.05)' : 'var(--white)'
                          }}>
                          📅 Schedule
                        </button>
                      ) : (
                        <div style={{
                          fontSize: '0.8rem', color: 'var(--primary)', padding: '0.5rem 1rem',
                          background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px',
                          border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 600
                        }}>
                          ✅ Scheduled: {form.date}
                        </div>
                      )}
                    </div>

                    {/* Expanded ingredients */}
                    {isExpanded && r.ingredients?.length > 0 && (
                      <div style={{
                        padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '16px',
                        marginTop: '0.5rem', animation: 'fadeIn 0.3s ease'
                      }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>REQUIRED INGREDIENTS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {r.ingredients.map((ing, j) => (
                            <span key={j} style={{
                              fontSize: '0.8rem', background: '#fff', border: '1px solid var(--card-border)',
                              padding: '0.3rem 0.6rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Meal Schedule inline form ── */}
                    {showSched && !form.done && (
                      <div style={{
                        marginTop: '1rem', padding: '1.25rem', borderRadius: '20px',
                        background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                        animation: 'slideUp 0.3s ease'
                      }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.05em' }}>SCHEDULE MEAL</div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Select Date</label>
                            <input type="date" min={today()} value={form.date || ''}
                              onChange={e => setSF(i, { date: e.target.value })}
                              style={{ padding: '0.6rem', borderRadius: '12px' }} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Meal Type</label>
                            <select value={form.meal_type || ''} onChange={e => setSF(i, { meal_type: e.target.value })}
                              style={{ padding: '0.6rem', borderRadius: '12px' }}>
                              <option value=''>Type</option>
                              {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Notes</label>
                          <input type="text" value={form.description || ''}
                            onChange={e => setSF(i, { description: e.target.value })}
                            placeholder="Add a note…"
                            style={{ padding: '0.6rem', borderRadius: '12px' }} />
                        </div>

                        {form.error && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--danger)', margin: 0, fontWeight: 500 }}>{form.error}</p>
                        )}

                        <button onClick={() => handleAddToSchedule(r, i)} disabled={form.loading}
                          className="btn-primary"
                          style={{
                            width: '100%', padding: '0.8rem', fontSize: '0.9rem',
                            background: '#3b82f6', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                          }}>
                          {form.loading ? '⏳ Scheduling…' : 'Confirm Selection'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Recommendations;
