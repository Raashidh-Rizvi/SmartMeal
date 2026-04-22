import React, { useState, useRef, useContext } from 'react';
import { searchRecommendations, rateRecipe, getRecipes, createRecipe } from '../api/recipes';
import { createMeal } from '../services/mealService';
import { AuthContext } from '../context/AuthContext';

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
  const { user } = useContext(AuthContext);
  const userId   = user?.id || user?._id || '1';

  // ── search state ──────────────────────────────────────────────────────────
  const [inputVal, setInputVal]       = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [diet, setDiet]               = useState('');
  const [timeMax, setTimeMax]         = useState('');
  const [topN, setTopN]               = useState(5);
  const [recipes, setRecipes]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const inputRef = useRef(null);

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
    setTimeout(() => inputRef.current?.focus(), 50);
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
  const resolveRecipeId = async (r) => {
    const searchRes = await getRecipes({ search: r.name, limit: 5 });
    const matched = (searchRes.data || []).find(
      rec => rec.title?.toLowerCase() === r.name?.toLowerCase()
    ) || searchRes.data?.[0];
    if (matched) return matched._id;

    // Auto-create from AI data
    const ingredients = (r.ingredients || []).map(ing => {
      const parts = String(ing).trim().split(' ');
      const qty = parseFloat(parts[0]);
      if (!isNaN(qty) && parts.length >= 3)
        return { name: parts.slice(2).join(' ').slice(0, 100), quantity: qty, unit: parts[1].slice(0, 50) };
      return { name: String(ing).trim().slice(0, 100), quantity: 1, unit: 'serving' };
    }).filter(i => i.name);

    const steps = r.instructions
      ? String(r.instructions).split(/[.\n]/).map(s => s.trim()).filter(Boolean)
      : [`Prepare ${r.name} using the listed ingredients.`];

    const mealType = sf(null)?.meal_type || 'lunch';
    const newRecipe = await createRecipe({
      title: r.name,
      description: `AI-recommended recipe. Cuisine: ${r.cuisine || 'N/A'}. Diet: ${r.diet || 'N/A'}.`,
      category: mealType,
      ingredients,
      preparation_steps: steps,
      dietary_tags: r.diet && r.diet !== 'N/A' ? [r.diet] : [],
      estimated_cooking_time: (() => {
        const m = String(r.prep_time || '').match(/(\d+)/);
        return m ? parseInt(m[1]) : null;
      })(),
    });
    return newRecipe.data._id || newRecipe.data.id;
  };

  const handleAddToSchedule = async (r, idx) => {
    const form = sf(idx);
    if (!form.date)      { setSF(idx, { error: 'Please select a date.' }); return; }
    if (!form.meal_type) { setSF(idx, { error: 'Please select a meal type.' }); return; }

    setSF(idx, { loading: true, error: null });
    try {
      const recipeId = await resolveRecipeId(r);
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

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>🤖 AI Recipe Recommendations</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Add your available ingredients — the AI finds recipes that use them all together.
        </p>
      </div>

      {/* Search form */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600 }}>
              Your Ingredients
              <span style={{ fontWeight: 400, fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                (press Enter or comma after each)
              </span>
            </label>

            {/* Tag box */}
            <div onClick={() => inputRef.current?.focus()} style={{
              display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
              padding: '0.5rem 0.75rem', minHeight: '46px',
              border: `1px solid ${errorMsg ? 'var(--danger)' : 'var(--card-border)'}`,
              borderRadius: '8px', background: 'var(--card-bg)', cursor: 'text', alignItems: 'center',
            }}>
              {ingredients.map((ing, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.82rem',
                  background: 'rgba(5,150,105,0.12)', color: 'var(--primary)',
                  border: '1px solid rgba(5,150,105,0.3)',
                }}>
                  {ing}
                  <span onClick={e => { e.stopPropagation(); removeIngredient(i); }}
                    style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1 }}>×</span>
                </span>
              ))}
              <input ref={inputRef} type="text" value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => { if (inputVal.trim()) addIngredient(inputVal); }}
                placeholder={ingredients.length === 0 ? 'e.g. chicken, rice, onion…' : 'Add more…'}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: 'var(--text)', flex: '1', minWidth: '120px', padding: '0.1rem 0' }}
              />
            </div>

            {errorMsg && <span style={{ fontSize: '0.82rem', color: 'var(--danger)', marginTop: '0.3rem', display: 'block' }}>{errorMsg}</span>}

            {/* Quick examples */}
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Try:</span>
              {['chicken rice onion', 'egg tomato garlic', 'potato spinach curry', 'pasta cheese garlic'].map(ex => (
                <button key={ex} type="button"
                  onClick={() => ex.split(' ').forEach(w => addIngredient(w))}
                  style={{ fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: '999px', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <label style={{ fontSize: '0.85rem' }}>Diet</label>
              <select value={diet} onChange={e => setDiet(e.target.value)}>
                {DIET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <label style={{ fontSize: '0.85rem' }}>Max Prep Time (min)</label>
              <input type="number" min="1" value={timeMax} onChange={e => setTimeMax(e.target.value)} placeholder="e.g. 30" />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
              <label style={{ fontSize: '0.85rem' }}>Results</label>
              <select value={topN} onChange={e => setTopN(parseInt(e.target.value))}>
                {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} recipes</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: 'auto', padding: '0.6rem 1.5rem', alignSelf: 'flex-end' }}>
              {loading ? 'Searching…' : '🔍 Find Recipes'}
            </button>
          </div>
        </form>
      </div>

      {loading && <p className="loading">Finding best matches for your ingredients…</p>}

      {/* Results */}
      {searched && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.2rem' }}>
                {recipes.length === 0 ? 'No recipes found' : `${recipes.length} Recipe${recipes.length > 1 ? 's' : ''} Found`}
              </h3>
              {ingredients.length > 0 && (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Using: {ingredients.join(', ')}
                </p>
              )}
            </div>
            <button className="btn-secondary" onClick={handleReset}
              style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              ← New Search
            </button>
          </div>

          {recipes.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No recipes matched your ingredients. Try adding more or removing filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {recipes.map((r, i) => {
                const isExpanded = expandedIdx === i;
                const form       = sf(i);
                const showSched  = !!form.open;

                return (
                  <div key={i} className="card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                    {/* Name + match % */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>{r.name}</div>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px',
                        background: 'rgba(5,150,105,0.1)', color: scoreColor(r.similarity_score),
                        border: `1px solid ${scoreColor(r.similarity_score)}44`, flexShrink: 0,
                      }}>
                        {(r.similarity_score * 100).toFixed(0)}% match
                      </span>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {r.cuisine   && <span className="badge badge-admin" style={{ fontSize: '0.72rem' }}>{r.cuisine}</span>}
                      {r.diet      && <span className="badge badge-user"  style={{ fontSize: '0.72rem' }}>{r.diet}</span>}
                      {r.course    && <span className="badge"             style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>{r.course}</span>}
                      {r.prep_time && r.prep_time !== '' && (
                        <span className="badge" style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>⏱ {r.prep_time}</span>
                      )}
                    </div>

                    {/* Matched keywords */}
                    {r.matched_keywords?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {r.matched_keywords.map(kw => (
                          <span key={kw} style={{ fontSize: '0.72rem', background: 'rgba(5,150,105,0.12)', color: 'var(--primary)', padding: '0.1rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(5,150,105,0.25)' }}>
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Explanation */}
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                      {r.match_explanation}
                    </p>

                    {/* Star rating */}
                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => handleRating(r._id, star, i)}
                          style={{ cursor: r._id ? 'pointer' : 'default', fontSize: '1.1rem', color: star <= (r._userRating || 0) ? '#f59e0b' : 'var(--card-border)' }}>★</span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {/* Show ingredients toggle */}
                      <button onClick={() => setExpandedIdx(isExpanded ? null : i)}
                        style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', background: isExpanded ? 'var(--primary)' : 'transparent', color: isExpanded ? '#fff' : 'var(--primary)', border: '1px solid var(--primary)' }}>
                        {isExpanded ? '▲ Hide Ingredients' : '🥘 Ingredients'}
                      </button>

                      {/* Add to Meal Schedule toggle */}
                      {!form.done ? (
                        <button onClick={() => setSF(i, { open: !showSched, error: null })}
                          style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', background: showSched ? '#3b82f6' : 'transparent', color: showSched ? '#fff' : '#3b82f6', border: '1px solid #3b82f6' }}>
                          📅 Add to Meal Schedule
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', padding: '0.3rem 0.6rem', background: 'rgba(5,150,105,0.08)', borderRadius: '6px', border: '1px solid rgba(5,150,105,0.2)' }}>
                          ✅ Scheduled for {form.date} ({form.meal_type})
                        </span>
                      )}
                    </div>

                    {/* Expanded ingredients */}
                    {isExpanded && r.ingredients?.length > 0 && (
                      <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {r.ingredients.map((ing, j) => (
                            <span key={j} style={{ fontSize: '0.75rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Meal Schedule inline form ── */}
                    {showSched && !form.done && (
                      <div style={{ marginTop: '0.5rem', padding: '0.9rem', borderRadius: '8px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6' }}>📅 Schedule this recipe</div>

                        {/* Date + Meal Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.8rem' }}>Date *</label>
                            <input type="date" min={today()} value={form.date || ''}
                              onChange={e => setSF(i, { date: e.target.value })}
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', border: '1px solid var(--card-border)', borderRadius: '6px', background: 'var(--card-bg)', color: 'var(--text)', width: '100%' }} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.8rem' }}>Meal Type *</label>
                            <select value={form.meal_type || ''} onChange={e => setSF(i, { meal_type: e.target.value })}
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', border: '1px solid var(--card-border)', borderRadius: '6px', background: 'var(--card-bg)', color: 'var(--text)', width: '100%' }}>
                              <option value=''>Select type</option>
                              {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.8rem' }}>Status</label>
                          <select value={form.status || 'planned'} onChange={e => setSF(i, { status: e.target.value })}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', border: '1px solid var(--card-border)', borderRadius: '6px', background: 'var(--card-bg)', color: 'var(--text)', width: '100%' }}>
                            {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        </div>

                        {/* Description */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.8rem' }}>Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                          <input type="text" value={form.description || ''}
                            onChange={e => setSF(i, { description: e.target.value })}
                            placeholder="e.g. Meal prep for the week"
                            maxLength={500}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', border: '1px solid var(--card-border)', borderRadius: '6px', background: 'var(--card-bg)', color: 'var(--text)', width: '100%' }} />
                        </div>

                        {/* Error */}
                        {form.error && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--danger)', margin: 0 }}>{form.error}</p>
                        )}

                        {/* Confirm button */}
                        <button onClick={() => handleAddToSchedule(r, i)} disabled={form.loading}
                          style={{ width: 'auto', alignSelf: 'flex-start', padding: '0.4rem 1.1rem', fontSize: '0.82rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: form.loading ? 'not-allowed' : 'pointer', opacity: form.loading ? 0.7 : 1 }}>
                          {form.loading ? '⏳ Adding…' : '✅ Confirm & Add'}
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
