import React, { useState, useEffect } from 'react';
import { leftoverService } from '../services/leftoverService';
import { getFoodImage } from '../services/imageService';

// ── Expiry helpers ──────────────────────────────────────────────────────────
const calcDaysLeft = (expiryDate) =>
  Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

const getExpiryBadge = (days, isUsed) => {
  if (isUsed) return <span className="badge badge-user">✓ Used</span>;
  if (days < 0)  return <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}>Expired</span>;
  if (days <= 2) return <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>⚠️ Expiring Soon</span>;
  return <span className="badge badge-admin">✅ Fresh · {days}d left</span>;
};

// ── MEMBER 4: Ingredient Cleaning Logic ──────────────────────────────────────
// 👥 MEMBER 4 processes raw leftover input by cleaning and extracting key ingredients
// into a structured format that the system can use for recipe suggestions.

// Common filler words to remove (cooking methods, connectors, articles)
const FILLER_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'with', 'in', 'of', 'to', 'for',
  'fried', 'baked', 'grilled', 'boiled', 'roasted', 'steamed', 'cooked',
  'raw', 'fresh', 'dried', 'sliced', 'chopped', 'minced', 'crushed',
  'hot', 'cold', 'spicy', 'sweet', 'salty', 'warm', 'whole', 'half',
  'piece', 'cup', 'bowl', 'plate', 'serving', 'tablespoon', 'teaspoon'
]);

const cleanIngredient = (text) => {
  if (!text) return [];
  
  // Step 1: Convert to lowercase and strip whitespace
  let cleaned = text.toLowerCase().trim();
  
  // Step 2: Remove symbols and special characters
  cleaned = cleaned.replace(/[\+\*\-\&\/\\,\.\_\(\)\[\]]/g, ' ');
  
  // Step 3: Split into words and filter out filler words
  const words = cleaned.split(/\s+/)
    .filter(word => word.length > 0)  // Remove empty strings
    .filter(word => !FILLER_WORDS.has(word));  // Remove filler words
  
  // Step 4: Return array of cleaned individual words
  return words;
};

const extractIngredientsFromLeftover = (ingredientsList) => {
  if (!ingredientsList || ingredientsList.length === 0) return [];
  
  // Process: Clean each ingredient and extract individual words/ingredients
  // flatMap to flatten arrays from each ingredient into single array
  const allCleaned = ingredientsList
    .flatMap(ing => cleanIngredient(ing))
    .filter(ing => ing && ing.length > 0);  // Remove empty strings
  
  // Remove duplicates using Set
  return [...new Set(allCleaned)];
};

const generateRecipesForLeftover = (leftoverItem, showToast) => {
  // Extract and clean ingredients from this specific leftover
  const cleanedIngredients = extractIngredientsFromLeftover(leftoverItem.ingredients);
  
  if (cleanedIngredients.length === 0) {
    showToast('error', `"${leftoverItem.name}" has no valid ingredients. Please edit to add ingredients.`);
    return;
  }
  
  // Build the ingredient query string from cleaned ingredients
  const ingredientQuery = cleanedIngredients.join(', ');
  
  console.log(`\n🍳 GENERATING RECIPES FOR: "${leftoverItem.name}"`);
  console.log(`📋 Step 1 - Original ingredients:`, leftoverItem.ingredients);
  console.log(`   → Lowercase + Remove symbols + Remove filler words`);
  console.log(`✨ Step 2 - Cleaned ingredients:`, cleanedIngredients);
  console.log(`🔍 Step 3 - Query for recipe engine:`, ingredientQuery);
  console.log(`─`.repeat(60));
  
  // Show success message with cleaned ingredients
  showToast('success', `🍳 Generating recipes for "${leftoverItem.name}" with: ${ingredientQuery}`);
  
  // Return cleaned data for potential API call
  return {
    leftover_id: leftoverItem.id,
    leftover_name: leftoverItem.name,
    original_ingredients: leftoverItem.ingredients,
    cleaned_ingredients: cleanedIngredients,
    ingredient_query: ingredientQuery
  };
};

// ── Empty form ──────────────────────────────────────────────────────────────
const emptyForm = {
  name: '', qty_value: '', qty_unit: 'servings', category: '',
  cooked_date: '', expiry_date: '', storage_location: 'fridge',
  notes: '', ingredients: ''
};

function Leftovers() {
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

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchLeftovers = async () => {
    try {
      setLoading(true);
      const res = await leftoverService.getAll(includeUsed);
      setLeftovers(res.data);
      setSelectedIds([]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeftovers(); }, [includeUsed]);

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
    setUseNowIds(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
    if (!selectedIds.includes(item.id))
      setSelectedIds(prev => [...prev, item.id]);
    showToast('success', `"${item.name}" ingredients queued for recipe generation!`);
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === leftovers.filter(l => !l.is_used).length
      ? [] : leftovers.filter(l => !l.is_used).map(l => l.id));

  // ── Selected ingredients preview ──────────────────────────────────────────
  const selectedLeftovers = leftovers.filter(l => selectedIds.includes(l.id));
  const combinedIngredients = [...new Set(
    selectedLeftovers.flatMap(l => l.ingredients || [])
  )];

  // ── Generate recipes (one by one, with MEMBER 4 cleaning) ──────────────────
  const handleGenerateRecipes = () => {
    if (selectedIds.length === 0) {
      showToast('error', 'Please select at least one leftover to generate recipes!');
      return;
    }
    
    // Get all selected leftovers
    const selectedLeftoversData = leftovers.filter(l => selectedIds.includes(l.id));
    
    if (selectedLeftoversData.length === 0) {
      showToast('error', 'No leftovers found for selected items.');
      return;
    }
    
    console.log('\n🎯 RECIPE GENERATION STARTED');
    console.log(`📊 Processing ${selectedLeftoversData.length} leftover(s) one by one...`);
    console.log(`═`.repeat(60));
    
    // Process each leftover individually
    const results = selectedLeftoversData.map((leftover, index) => {
      console.log(`\n[${index + 1}/${selectedLeftoversData.length}]`);
      return generateRecipesForLeftover(leftover, showToast);
    });
    
    // Filter out any null results (items with no ingredients)
    const validResults = results.filter(r => r !== undefined);
    
    if (validResults.length === 0) {
      showToast('error', 'None of the selected items have valid ingredients.');
      return;
    }
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`✅ RECIPE GENERATION COMPLETE`);
    console.log(`✨ Successfully processed ${validResults.length} leftover(s)`);
    console.log(`📋 Results stored for recipe recommendation engine`);
    
    showToast('success', `✨ Generated recipes for ${validResults.length} items!`);
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
      {/* Stats */}
      <div className="stats-section" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: '🍽️', label: 'Total Items',   value: stats.total },
          { icon: '⚠️', label: 'Expiring Soon', value: stats.expiring },
          { icon: '❌', label: 'Expired',        value: stats.expired },
        ].map(({ icon, label, value }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-info"><h3>{label}</h3><p className="stat-value">{value}</p></div>
          </div>
        ))}
      </div>

      {/* Selected Ingredients Preview */}
      {selectedIds.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--primary)' }}>
                🧺 Selected Items ({selectedIds.length} item{selectedIds.length > 1 ? 's' : ''})
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
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(59,130,246,0.05)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--primary)' }}>
                💡 Each leftover will generate recipes individually with cleaned ingredients
              </div>
            </div>
            <button onClick={handleGenerateRecipes}
              style={{ width: 'auto', padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', flexShrink: 0 }}>
              🍳 Generate Recipes
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
                style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
                🍳 Generate Recipes
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
          <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            💡 Tip: Select items using the checkboxes, then click <strong>Generate Recipes</strong> to get recipe ideas from your ingredients.
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
                      <td>{item.storage_location === 'fridge' ? '🧊 Fridge' : item.storage_location === 'freezer' ? '❄️ Freezer' : '🏠 Room'}</td>
                      <td>{new Date(item.expiry_date).toLocaleDateString()}</td>
                      <td>{getExpiryBadge(days, item.is_used)}</td>
                      <td>
                        <div className="action-buttons">
                          {!item.is_used && (
                            <>
                              <button onClick={() => openModal(item)} className="btn-icon">Edit</button>
                              <span style={{ color: 'var(--text-muted)' }}>|</span>
                              <button onClick={() => handleUseNow(item)} className="btn-icon" title="Queue ingredients for recipe generation" style={{ color: '#f59e0b' }}>Use Now</button>
                              <span style={{ color: 'var(--text-muted)' }}>|</span>
                              <button onClick={() => handleMarkUsed(item.id)} className="btn-icon">✓ Used</button>
                              <span style={{ color: 'var(--text-muted)' }}>|</span>
                            </>
                          )}
                          <button onClick={() => handleDelete(item.id)} className="btn-icon text-danger">Delete</button>
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
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingItem ? '✏️ Edit Leftover' : '🍽️ Add Leftover'}</h2>
            <form onSubmit={handleSubmit} noValidate>

              {/* Food Name */}
              <div className="form-group">
                <label>Food Name *</label>
                <input type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chicken Curry"
                  style={formErrors.name ? { borderColor: 'var(--danger)' } : {}} />
                {formErrors.name && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{formErrors.name}</span>}
              </div>

              {/* Ingredients */}
              <div className="form-group">
                <label>Ingredients * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>(comma-separated)</span></label>
                <input type="text" value={formData.ingredients}
                  onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="e.g., chicken, rice, onion, garlic"
                  style={formErrors.ingredients ? { borderColor: 'var(--danger)' } : {}} />
                {formErrors.ingredients
                  ? <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{formErrors.ingredients}</span>
                  : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Used for AI recipe recommendations</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Quantity value + unit */}
                <div className="form-group">
                  <label>Quantity *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" min="0.1" step="0.1" value={formData.qty_value}
                      onChange={e => setFormData({ ...formData, qty_value: e.target.value })}
                      placeholder="2" style={{ width: '60%', ...(formErrors.qty_value ? { borderColor: 'var(--danger)' } : {}) }} />
                    <select value={formData.qty_unit}
                      onChange={e => setFormData({ ...formData, qty_unit: e.target.value })}
                      style={{ width: '40%' }}>
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
              </div>

              {/* Storage */}
              <div className="form-group">
                <label>Storage Location</label>
                <select value={formData.storage_location}
                  onChange={e => setFormData({ ...formData, storage_location: e.target.value })}>
                  <option value="fridge">🧊 Fridge</option>
                  <option value="freezer">❄️ Freezer</option>
                  <option value="room">🏠 Room</option>
                </select>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Notes (optional)</label>
                <input type="text" value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit">{editingItem ? 'Update' : 'Add Leftover'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default Leftovers;
