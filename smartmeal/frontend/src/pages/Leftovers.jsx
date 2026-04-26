import React, { useState, useEffect, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import { leftoverService } from '../services/leftoverService';
import { getFoodImage } from '../services/imageService';
import { getRecipes, createRecipe } from '../api/recipes';
import { createMeal } from '../services/mealService';
import { AuthContext } from '../context/AuthContext';
import { 
  Check, 
  AlertTriangle, 
  CheckCircle, 
  Utensils, 
  Clock, 
  XCircle, 
  ShoppingBag, 
  Sparkles, 
  Snowflake, 
  CloudSnow, 
  Home, 
  Pencil, 
  List, 
  Calendar, 
  Bot, 
  Salad, 
  ChefHat,
  Plus,
  Trash2,
  ChevronUp,
  Search,
  Info,
  Refrigerator
} from 'lucide-react';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// ── Expiry helpers ──────────────────────────────────────────────────────────
const calcDaysLeft = (expiryDate) =>
  Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

const getExpiryBadge = (days, isUsed) => {
  if (isUsed) return <span className="badge badge-user" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Check size={12} /> Used</span>;
  if (days < 0)  return <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={12} /> Expired</span>;
  if (days <= 2) return <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={12} /> Expiring Soon</span>;
  return <span className="badge badge-admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12} /> Fresh · {days}d left</span>;
};

// Cleaner logic removed as it was unused

// extractIngredientsFromLeftover removed as it was unused

// ── Empty form ──────────────────────────────────────────────────────────────
const emptyForm = {
  name: '', qty_value: '', qty_unit: 'servings', category: '',
  cooked_date: '', expiry_date: '', storage_location: 'fridge',
  notes: '', ingredients: ''
};

function Leftovers() {
  const { user } = useContext(AuthContext);
  const userId = user?.id || user?._id || '1';
  const [leftovers, setLeftovers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editingItem, setEditingItem]   = useState(null);
  const [includeUsed, setIncludeUsed]   = useState(false);
  const [toast, setToast]               = useState(null);
  const [formData, setFormData]         = useState(emptyForm);
  const [formErrors, setFormErrors]     = useState({});
  const [selectedIds, setSelectedIds]   = useState([]);
  const [useNowIds, setUseNowIds]       = useState([]);
  const [recipes, setRecipes]           = useState(null);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(null);   // index of expanded card
  const [scheduleForm, setScheduleForm]   = useState({});       // { [idx]: { date, meal_type, loading, done, error } }

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchLeftovers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await leftoverService.getAll(includeUsed);
      setLeftovers(res.data);
      setSelectedIds([]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [includeUsed]);

  useEffect(() => { fetchLeftovers(); }, [fetchLeftovers]);

  // ── Form validation ───────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!formData.name.trim())        errors.name = 'Food name is required';
    if (!formData.qty_value.trim())   errors.qty_value = 'Quantity is required';
    if (!formData.category.trim())    errors.category = 'Category is required';
    if (!formData.cooked_date)        errors.cooked_date = 'Cooked date is required';
    if (!formData.expiry_date)        errors.expiry_date = 'Expiry date is required';
    if (formData.cooked_date && formData.expiry_date &&
        new Date(formData.expiry_date) <= new Date(formData.cooked_date))
      errors.expiry_date = 'Expiry must be after cooked date';
    if (formData.cooked_date && new Date(formData.cooked_date) > new Date())
      errors.cooked_date = 'Cooked date cannot be in the future';
    if (!formData.ingredients.trim()) errors.ingredients = 'At least one ingredient is required';
    return errors;
  };

  // ── Open modal ────────────────────────────────────────────────────────────
  const openModal = (item = null) => {
    setFormErrors({});
    if (item) {
      setEditingItem(item);
      const [qty_value = '', qty_unit = 'servings'] = (item.quantity || '').split(' ');
      setFormData({
        name: item.name,
        qty_value,
        qty_unit,
        category: item.category,
        cooked_date: new Date(item.cooked_date).toISOString().slice(0, 16),
        expiry_date: new Date(item.expiry_date).toISOString().slice(0, 16),
        storage_location: item.storage_location,
        notes: item.notes || '',
        ingredients: (item.ingredients || []).join(', ')
      });
    } else {
      setEditingItem(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    try {
      const payload = {
        name: formData.name.trim(),
        quantity: `${formData.qty_value.trim()} ${formData.qty_unit}`,
        category: formData.category.trim(),
        cooked_date: new Date(formData.cooked_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        storage_location: formData.storage_location,
        notes: formData.notes.trim(),
        image_url: getFoodImage(formData.name),
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean)
      };
      if (editingItem) {
        await leftoverService.update(editingItem.id, payload);
        showToast('success', 'Leftover updated!');
      } else {
        await leftoverService.create(payload);
        showToast('success', 'Leftover added!');
      }
      setShowModal(false);
      fetchLeftovers();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to save leftover');
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleMarkUsed = async (id) => {
    try {
      await leftoverService.markUsed(id);
      showToast('success', 'Marked as used!');
      fetchLeftovers();
    } catch { showToast('error', 'Failed to mark as used'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leftover?')) return;
    try {
      await leftoverService.delete(id);
      showToast('success', 'Deleted!');
      fetchLeftovers();
    } catch { showToast('error', 'Failed to delete'); }
  };

  const handleUseNow = (item) => {
    if (!item.ingredients || item.ingredients.length === 0) {
      showToast('error', `"${item.name}" has no ingredients. Please edit it to add ingredients first.`);
      return;
    }
    setUseNowIds(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
    handleGenerateRecipes([item]);
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === leftovers.filter(l => !l.is_used).length
      ? [] : leftovers.filter(l => !l.is_used).map(l => l.id));

  // ── Selected ingredients preview ──────────────────────────────────────────
  const selectedLeftovers = leftovers.filter(l => selectedIds.includes(l.id));
  // combinedIngredients removed as it was unused

  // ── Generate recipes via Leftover AI API ────────────────────────────────────
  const handleGenerateRecipes = async (overrideLeftovers = null) => {
    const targets = overrideLeftovers || leftovers.filter(l => selectedIds.includes(l.id));
    if (targets.length === 0) {
      showToast('error', 'Please select at least one leftover item');
      return;
    }
    // Validate: all selected items must have at least one ingredient
    const noIngredients = targets.filter(l => !l.ingredients || l.ingredients.length === 0);
    if (noIngredients.length === targets.length) {
      showToast('error', 'Selected items have no ingredients. Please edit them to add ingredients.');
      return;
    }
    if (noIngredients.length > 0) {
      showToast('error', `"${noIngredients.map(l => l.name).join(', ')}" has no ingredients and will be skipped.`);
    }
    const payload = targets
      .filter(l => l.ingredients && l.ingredients.length > 0)
      .map(l => ({ id: l.id, name: l.name, ingredients: l.ingredients }));
    setRecipesLoading(true);
    setRecipes(null);
    setExpandedRecipe(null);
    setScheduleForm({});
    try {
      const res = await leftoverService.generateRecipes(payload);
      setRecipes(res.data);
      if (!res.data.success) showToast('error', res.data.message);
      else showToast('success', res.data.message);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to generate recipes');
    } finally {
      setRecipesLoading(false);
    }
  };

  // ── Add AI recipe to Meal Schedule ──────────────────────────────────────────
  const handleAddToMealSchedule = async (recipe, idx) => {
    const form = scheduleForm[idx] || {};
    if (!form.date || !form.meal_type) {
      setScheduleForm(p => ({ ...p, [idx]: { ...form, error: 'Please select a date and meal type.' } }));
      return;
    }
    setScheduleForm(p => ({ ...p, [idx]: { ...form, loading: true, error: null } }));
    try {
      // 1. Try to find existing recipe in MongoDB
      let recipeId = null;
      const searchRes = await getRecipes({ search: recipe.name, limit: 5 });
      const matched = (searchRes.data || []).find(
        r => r.title?.toLowerCase() === recipe.name?.toLowerCase()
      ) || searchRes.data?.[0];

      if (matched) {
        recipeId = matched._id;
      } else {
        // 2. Auto-create the recipe from AI data
        const ingredients = (recipe.ingredients || []).map(ing => {
          // ing is a string like "chicken" or "2 cups rice"
          const parts = String(ing).trim().split(' ');
          const qty = parseFloat(parts[0]);
          if (!isNaN(qty) && parts.length >= 3) {
            return { name: parts.slice(2).join(' '), quantity: qty, unit: parts[1] };
          }
          return { name: String(ing).trim(), quantity: 1, unit: 'serving' };
        }).filter(i => i.name);

        const steps = recipe.instructions
          ? String(recipe.instructions).split(/[.\n]/).map(s => s.trim()).filter(Boolean)
          : [`Prepare ${recipe.name} using the listed ingredients.`];

        const newRecipe = await createRecipe({
          title: recipe.name,
          description: recipe.explanation || `AI-suggested recipe from leftover ingredients.`,
          category: form.meal_type,
          ingredients,
          preparation_steps: steps,
          dietary_tags: recipe.diet && recipe.diet !== 'N/A' ? [recipe.diet] : [],
          estimated_cooking_time: (() => {
            const m = String(recipe.prep_time || '').match(/(\d+)/);
            return m ? parseInt(m[1]) : null;
          })(),
        });
        recipeId = newRecipe.data._id || newRecipe.data.id;
      }

      // 3. Create meal schedule entry
      await createMeal({
        user_id:     userId,
        recipe_id:   recipeId,
        meal_date:   form.date,
        meal_type:   form.meal_type,
        status:      'planned',
        description: `Added from Leftover AI suggestions`,
      });

      setScheduleForm(p => ({ ...p, [idx]: { ...form, loading: false, done: true, error: null } }));
      showToast('success', `"${recipe.name}" added to meal schedule!`);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add to meal schedule';
      setScheduleForm(p => ({ ...p, [idx]: { ...form, loading: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg) } }));
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:    leftovers.length,
    expiring: leftovers.filter(l => !l.is_used && calcDaysLeft(l.expiry_date) >= 0 && calcDaysLeft(l.expiry_date) <= 2).length,
    expired:  leftovers.filter(l => !l.is_used && calcDaysLeft(l.expiry_date) < 0).length,
  };

  const activeLeftovers = leftovers.filter(l => !l.is_used);

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 1rem 2rem' }}>
        <Refrigerator size={48} color="var(--primary)" strokeWidth={1.75} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>Leftover Tracker</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>Track, manage, and make the most of your leftover food</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-section" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: <Utensils size={20} />, label: 'Total Items',   value: stats.total, color: 'var(--primary)' },
          { icon: <Clock size={20} />, label: 'Expiring Soon', value: stats.expiring, color: '#f59e0b' },
          { icon: <XCircle size={20} />, label: 'Expired',        value: stats.expired, color: 'var(--danger)' },
        ].map(({ icon, label, value, color }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ color }}>{icon}</div>
            <div className="stat-info"><h3>{label}</h3><p className="stat-value">{value}</p></div>
          </div>
        ))}
      </div>

      {/* Selected Ingredients Preview */}
      {selectedIds.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} /> Selected Items ({selectedIds.length} item{selectedIds.length > 1 ? 's' : ''})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedLeftovers.map((leftover, idx) => (
                  <div key={leftover.id} style={{ padding: '0.5rem 0.75rem', background: 'rgba(5,150,105,0.05)', borderRadius: '6px', border: '1px solid rgba(5,150,105,0.15)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                      {idx + 1}. {leftover.name}
                    </div>
                    {leftover.ingredients && leftover.ingredients.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {leftover.ingredients.map(ing => (
                          <span key={ing} className="badge" style={{ fontSize: '0.75rem', background: 'rgba(5,150,105,0.12)', color: 'var(--primary)', border: '1px solid rgba(5,150,105,0.2)' }}>{ing}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—No ingredients</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(59,130,246,0.05)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={14} color="var(--primary)" />
                <span>Each leftover will generate recipes individually with cleaned ingredients</span>
              </div>
            </div>
            <button onClick={handleGenerateRecipes}
              className="btn-primary"
              style={{ width: 'auto', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <Sparkles size={18} /> Generate Recipes
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Leftover Tracker</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              {selectedIds.length === 0
                ? 'Select items to generate recipes from their ingredients.'
                : `${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''} selected`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeUsed} onChange={e => setIncludeUsed(e.target.checked)} />
              Show used
            </label>
            {selectedIds.length > 0 && (
              <button onClick={handleGenerateRecipes}
                style={{ width: 'auto', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChefHat size={18} /> Generate Recipes
              </button>
            )}
            <button onClick={() => openModal()}
              style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
              + Add Leftover
            </button>
          </div>
        </div>

        {/* Hint when nothing selected */}
        {!loading && activeLeftovers.length > 0 && selectedIds.length === 0 && (
          <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={18} color="var(--primary)" />
            <span>Tip: Select items using the checkboxes, then click <strong>Generate Recipes</strong> to get recipe ideas from your ingredients.</span>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="loading">Loading leftovers...</p>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox"
                      checked={activeLeftovers.length > 0 && selectedIds.length === activeLeftovers.length}
                      onChange={toggleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th>Food</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Ingredients</th>
                  <th>Storage</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leftovers.length === 0 ? (
                  <tr><td colSpan="9" className="empty-message">No leftovers tracked yet. Add your first one!</td></tr>
                ) : leftovers.map(item => {
                  const days = calcDaysLeft(item.expiry_date);
                  const isSelected = selectedIds.includes(item.id);
                  const isUseNow = useNowIds.includes(item.id);
                  return (
                    <tr key={item.id}
                      className={days < 0 && !item.is_used ? 'row-danger' : ''}
                      style={isSelected ? { background: 'rgba(5,150,105,0.06)' } : isUseNow ? { background: 'rgba(245,158,11,0.06)' } : {}}>
                      <td>
                        {!item.is_used && (
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} />
                        )}
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                        {item.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.notes}</div>}
                      </td>
                      <td>{item.category}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {item.ingredients && item.ingredients.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {item.ingredients.slice(0, 3).map(ing => (
                              <span key={ing} style={{ fontSize: '0.75rem', background: 'rgba(5,150,105,0.08)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(5,150,105,0.2)' }}>{ing}</span>
                            ))}
                            {item.ingredients.length > 3 && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{item.ingredients.length - 3} more</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {item.storage_location === 'fridge' ? <Snowflake size={14} /> : item.storage_location === 'freezer' ? <CloudSnow size={14} /> : <Home size={14} />}
                          {item.storage_location === 'fridge' ? 'Fridge' : item.storage_location === 'freezer' ? 'Freezer' : 'Room'}
                        </div>
                      </td>
                      <td>{new Date(item.expiry_date).toLocaleDateString()}</td>
                      <td>{getExpiryBadge(days, item.is_used)}</td>
                      <td>
                        <div className="action-buttons">
                          {!item.is_used && (
                            <>
                              <button onClick={() => openModal(item)} className="btn-icon" title="Edit" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Pencil size={14} /> Edit</button>
                              <span style={{ color: 'var(--text-muted)' }}>|</span>
                              <button onClick={() => handleUseNow(item)} className="btn-icon" title="Queue ingredients for recipe generation" style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Sparkles size={14} /> Use Now</button>
                              <span style={{ color: 'var(--text-muted)' }}>|</span>
                              <button onClick={() => handleMarkUsed(item.id)} className="btn-icon" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Check size={14} /> Used</button>
                              <span style={{ color: 'var(--text-muted)' }}>|</span>
                            </>
                          )}
                          <button onClick={() => handleDelete(item.id)} className="btn-icon text-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Trash2 size={14} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {editingItem ? <Pencil size={24} color="var(--primary)" /> : <Utensils size={24} color="var(--primary)" />}
              {editingItem ? 'Edit Leftover' : 'Add Leftover'}
            </h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                {/* Food Name */}
                <div className="form-group form-group-full">
                  <label>Food Name *</label>
                  <input type="text" value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Chicken Curry"
                    style={formErrors.name ? { borderColor: 'var(--danger)' } : {}} />
                  {formErrors.name && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{formErrors.name}</span>}
                </div>

                {/* Ingredients */}
                <div className="form-group form-group-full">
                  <label>Ingredients * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>(comma-separated)</span></label>
                  <input type="text" value={formData.ingredients}
                    onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="e.g., chicken, rice, onion, garlic"
                    style={formErrors.ingredients ? { borderColor: 'var(--danger)' } : {}} />
                  {formErrors.ingredients
                    ? <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{formErrors.ingredients}</span>
                    : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Used for AI recommendations</span>}
                </div>

                {/* Quantity value + unit */}
                <div className="form-group">
                  <label>Quantity *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" min="0.1" step="0.1" value={formData.qty_value}
                      onChange={e => setFormData({ ...formData, qty_value: e.target.value })}
                      placeholder="2" style={{ width: '55%', ...(formErrors.qty_value ? { borderColor: 'var(--danger)' } : {}) }} />
                    <select value={formData.qty_unit}
                      onChange={e => setFormData({ ...formData, qty_unit: e.target.value })}
                      style={{ width: '45%' }}>
                      {['servings','cups','grams','kg','pieces','bowls','plates','liters','ml'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  {formErrors.qty_value && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{formErrors.qty_value}</span>}
                </div>

                {/* Category */}
                <div className="form-group">
                  <label>Category *</label>
                  <input type="text" value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Main Course"
                    style={formErrors.category ? { borderColor: 'var(--danger)' } : {}} />
                  {formErrors.category && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{formErrors.category}</span>}
                </div>

                {/* Cooked Date */}
                <div className="form-group">
                  <label>Cooked Date *</label>
                  <input type="datetime-local" value={formData.cooked_date}
                    onChange={e => setFormData({ ...formData, cooked_date: e.target.value })}
                    max={new Date().toISOString().slice(0, 16)}
                    style={formErrors.cooked_date ? { borderColor: 'var(--danger)' } : {}} />
                  {formErrors.cooked_date && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{formErrors.cooked_date}</span>}
                </div>

                {/* Expiry Date */}
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input type="datetime-local" value={formData.expiry_date}
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                    min={formData.cooked_date || undefined}
                    style={formErrors.expiry_date ? { borderColor: 'var(--danger)' } : {}} />
                  {formErrors.expiry_date && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{formErrors.expiry_date}</span>}
                </div>

                {/* Storage */}
                <div className="form-group form-group-full">
                  <label>Storage Location</label>
                  <select value={formData.storage_location}
                    onChange={e => setFormData({ ...formData, storage_location: e.target.value })}>
                    <option value="fridge">Fridge</option>
                    <option value="freezer">Freezer</option>
                    <option value="room">Room</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="form-group form-group-full">
                  <label>Notes (optional)</label>
                  <textarea value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
                    placeholder="Any additional notes..." />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary flex-1">{editingItem ? 'Update' : 'Add Leftover'}</button>
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Recipe Results */}
      {(recipesLoading || recipes) && (
        <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={20} /> AI Recipe Suggestions
          </h3>

          {recipesLoading && <p className="loading">Generating recipes…</p>}

          {!recipesLoading && recipes && !recipes.success && (
            <p style={{ color: 'var(--danger)', margin: 0 }}>{recipes.message}</p>
          )}

          {!recipesLoading && recipes?.success && (
            <>
              {/* Combined ingredients used */}
              {recipes.combined_ingredients?.length > 0 && (
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Salad size={14} />
                  <span><strong>Ingredients used:</strong> {recipes.combined_ingredients.join(', ')}</span>
                </div>
              )}

              {/* Rule-based quick suggestions */}
              {recipes.rule_based_suggestions?.length > 0 && (
                <div style={{ marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(245,158,11,0.07)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={14} color="#f59e0b" />
                  <span><strong>Quick ideas:</strong> {recipes.rule_based_suggestions.join(' · ')}</span>
                </div>
              )}

              {/* Recipe cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {recipes.recipes.map((r, i) => {
                  const isExpanded = expandedRecipe === i;
                  const sf = scheduleForm[i] || {};
                  const showScheduler = sf.open;
                  return (
                    <div key={i} style={{ padding: '1rem', border: '1px solid rgba(5,150,105,0.2)', borderRadius: '10px', background: 'rgba(5,150,105,0.04)' }}>

                      {/* Recipe name */}
                      <div style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>{i + 1}. {r.name}</div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {r.cuisine && r.cuisine !== 'N/A' && (
                          <span className="badge badge-admin" style={{ fontSize: '0.72rem' }}>{r.cuisine}</span>
                        )}
                        {r.diet && r.diet !== 'N/A' && (
                          <span className="badge badge-user" style={{ fontSize: '0.72rem' }}>{r.diet}</span>
                        )}
                        {r.prep_time && r.prep_time !== 'N/A' && (
                          <span className="badge" style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={10} /> {r.prep_time}
                          </span>
                        )}
                      </div>

                      {/* Matched ingredients */}
                      {r.matched_ingredients?.length > 0 && (
                        <div style={{ marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {r.matched_ingredients.map(ing => (
                            <span key={ing} style={{ fontSize: '0.72rem', background: 'rgba(5,150,105,0.12)', color: 'var(--primary)', padding: '0.1rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(5,150,105,0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Check size={10} /> {ing}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Explanation */}
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', fontStyle: 'italic' }}>{r.explanation}</p>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setExpandedRecipe(isExpanded ? null : i)}
                          style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: isExpanded ? 'var(--primary)' : 'transparent', color: isExpanded ? '#fff' : 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <List size={14} />}
                          {isExpanded ? 'Hide Details' : 'Details'}
                        </button>
                        <button
                          onClick={() => setScheduleForm(p => ({ ...p, [i]: { ...sf, open: !showScheduler, done: false, error: null } }))}
                          style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: sf.done ? 'rgba(5,150,105,0.1)' : 'transparent', color: sf.done ? 'var(--primary)' : '#3b82f6', border: `1px solid ${sf.done ? 'var(--primary)' : '#3b82f6'}`, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {sf.done ? <CheckCircle size={14} /> : <Calendar size={14} />}
                          {sf.done ? 'Scheduled' : 'Add to Schedule'}
                        </button>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(5,150,105,0.15)' }}>
                          {r.ingredients?.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Salad size={14} /> Ingredients
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {r.ingredients.map((ing, j) => (
                                  <span key={j} style={{ fontSize: '0.75rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{ing}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {r.instructions && (
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <ChefHat size={14} /> Instructions
                              </div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{r.instructions}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Meal schedule inline form */}
                      {showScheduler && !sf.done && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)', borderRadius: '6px', padding: '0.75rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={14} /> Schedule this recipe
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            <input
                              type="date"
                              value={sf.date || ''}
                              min={new Date().toISOString().slice(0, 10)}
                              onChange={e => setScheduleForm(p => ({ ...p, [i]: { ...sf, date: e.target.value } }))}
                              style={{ flex: 1, minWidth: '130px', padding: '0.35rem 0.5rem', fontSize: '0.82rem', border: '1px solid var(--card-border)', borderRadius: '6px', background: 'var(--card-bg)', color: 'var(--text)' }}
                            />
                            <select
                              value={sf.meal_type || ''}
                              onChange={e => setScheduleForm(p => ({ ...p, [i]: { ...sf, meal_type: e.target.value } }))}
                              style={{ flex: 1, minWidth: '110px', padding: '0.35rem 0.5rem', fontSize: '0.82rem', border: '1px solid var(--card-border)', borderRadius: '6px', background: 'var(--card-bg)', color: 'var(--text)' }}
                            >
                              <option value=''>Meal type</option>
                              {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                          </div>
                          {sf.error && <p style={{ fontSize: '0.78rem', color: 'var(--danger)', margin: '0 0 0.4rem' }}>{sf.error}</p>}
                          <button
                            onClick={() => handleAddToMealSchedule(r, i)}
                            disabled={sf.loading}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '0.35rem 0.9rem', fontSize: '0.82rem', cursor: sf.loading ? 'not-allowed' : 'pointer', opacity: sf.loading ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            {sf.loading ? 'Adding...' : <><Check size={14} /> Confirm</>}
                          </button>
                        </div>
                      )}

                      {/* Already scheduled confirmation */}
                      {sf.done && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)', padding: '0.4rem 0.6rem', background: 'rgba(5,150,105,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={14} /> Added for {sf.date} ({sf.meal_type})
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default Leftovers;
