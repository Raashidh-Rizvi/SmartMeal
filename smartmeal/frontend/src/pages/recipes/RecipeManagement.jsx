import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    uploadRecipeImage,
} from '../../api/recipes';
import './recipes.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'];

const EMPTY_INGREDIENT = { name: '', quantity: '', unit: '' };
const EMPTY_FORM = {
    title: '',
    description: '',
    category: 'breakfast',
    ingredients: [{ ...EMPTY_INGREDIENT }],
    preparation_steps: [''],
    dietary_tags: '',
    estimated_cooking_time: '',
    image_url: '',
};

// ─── View Enum ────────────────────────────────────────────────────────────────
const VIEW = { LIST: 'list', DETAIL: 'detail', FORM: 'form' };

// ─────────────────────────────────────────────────────────────────────────────
function RecipeManagement() {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // UI state
    const [view, setView] = useState(VIEW.LIST);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [editMode, setEditMode] = useState(false);

    // List state
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'mine'
    const [skip, setSkip] = useState(0);
    const LIMIT = 12;

    // Form state
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setSkip(0);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Check for ?tab=mine from Navbar link or existing parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('tab') === 'mine' || params.get('created_by_me') === '1') {
            setActiveTab('mine');
        }
    }, [location.search]);

    // If navigated here with { state: { openCreate: true } }, open the form directly
    useEffect(() => {
        if (location.state?.openCreate) {
            setForm(EMPTY_FORM);
            setFormError('');
            setEditMode(false);
            setView(VIEW.FORM);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Fetch recipes list ───────────────────────────────────────────────────
    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { skip, limit: LIMIT };
            if (search) params.search = search;
            if (categoryFilter) params.category = categoryFilter;
            if (activeTab === 'mine' && user) params.created_by = user.id || user._id;

            const res = await getRecipes(params);
            setRecipes(res.data);
        } catch (err) {
            console.error('Fetch recipes error:', err);
            setError('Failed to load recipes. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter, activeTab, skip, user]);

    useEffect(() => {
        if (view === VIEW.LIST) fetchRecipes();
    }, [view, fetchRecipes]);

    // ── Open detail ──────────────────────────────────────────────────────────
    const openDetail = async (id) => {
        setError('');
        try {
            const res = await getRecipeById(id);
            setSelectedRecipe(res.data);
            setView(VIEW.DETAIL);
        } catch {
            setError('Could not load recipe details.');
        }
    };

    // ── Open create form ─────────────────────────────────────────────────────
    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError('');
        setEditMode(false);
        setView(VIEW.FORM);
    };

    // ── Open edit form ───────────────────────────────────────────────────────
    const openEdit = (recipe) => {
        setForm({
            title: recipe.title,
            description: recipe.description || '',
            category: recipe.category,
            ingredients: recipe.ingredients.length > 0
                ? recipe.ingredients.map(i => ({ ...i, quantity: String(i.quantity) }))
                : [{ ...EMPTY_INGREDIENT }],
            preparation_steps: recipe.preparation_steps.length > 0
                ? recipe.preparation_steps
                : [''],
            dietary_tags: (recipe.dietary_tags || []).join(', '),
            estimated_cooking_time: recipe.estimated_cooking_time != null
                ? String(recipe.estimated_cooking_time)
                : '',
            image_url: recipe.image_url || '',
        });
        setFormError('');
        setEditMode(true);
        setView(VIEW.FORM);
    };

    // ── Delete recipe ────────────────────────────────────────────────────────
    const handleDelete = async (recipe, e) => {
        if (e) e.stopPropagation(); // prevent opening details when clicked from list view
        if (!window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)) return;
        try {
            await deleteRecipe(recipe._id);
            if (view === VIEW.DETAIL) {
                setView(VIEW.LIST);
                setSelectedRecipe(null);
            } else {
                fetchRecipes(); // Refresh the list if deleted from the grid
            }
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to delete recipe.';
            setError(msg);
        }
    };

    // ── Image upload ─────────────────────────────────────────────────────────
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageUploading(true);
        setFormError('');
        try {
            const res = await uploadRecipeImage(file);
            setFormField('image_url', res.data.url);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Image upload failed.';
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setImageUploading(false);
        }
    };

    // ── Form field helpers ───────────────────────────────────────────────────
    const setFormField = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const setIngredient = (idx, field, value) =>
        setForm(prev => {
            const ingredients = [...prev.ingredients];
            ingredients[idx] = { ...ingredients[idx], [field]: value };
            return { ...prev, ingredients };
        });

    const addIngredient = () =>
        setForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { ...EMPTY_INGREDIENT }] }));

    const removeIngredient = (idx) =>
        setForm(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== idx),
        }));

    const setStep = (idx, value) =>
        setForm(prev => {
            const preparation_steps = [...prev.preparation_steps];
            preparation_steps[idx] = value;
            return { ...prev, preparation_steps };
        });

    const addStep = () =>
        setForm(prev => ({ ...prev, preparation_steps: [...prev.preparation_steps, ''] }));

    const removeStep = (idx) =>
        setForm(prev => ({
            ...prev,
            preparation_steps: prev.preparation_steps.filter((_, i) => i !== idx),
        }));

    // ── Submit form ──────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        // Validate
        if (!form.title.trim()) return setFormError('Title is required.');
        if (!form.category) return setFormError('Category is required.');
        const validIngredients = form.ingredients.filter(i => i.name.trim());
        if (validIngredients.length === 0) return setFormError('At least one ingredient is required.');
        for (const ing of validIngredients) {
            if (!ing.quantity || isNaN(Number(ing.quantity)) || Number(ing.quantity) <= 0)
                return setFormError(`Invalid quantity for ingredient "${ing.name}".`);
            if (!ing.unit.trim())
                return setFormError(`Unit is required for ingredient "${ing.name}".`);
        }
        const validSteps = form.preparation_steps.filter(s => s.trim());
        if (validSteps.length === 0) return setFormError('At least one preparation step is required.');

        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            category: form.category,
            image_url: form.image_url.trim() || null,
            ingredients: validIngredients.map(i => ({
                name: i.name.trim(),
                quantity: parseFloat(i.quantity),
                unit: i.unit.trim(),
            })),
            preparation_steps: validSteps,
            dietary_tags: form.dietary_tags
                ? form.dietary_tags.split(',').map(t => t.trim()).filter(Boolean)
                : [],
            estimated_cooking_time: form.estimated_cooking_time
                ? parseInt(form.estimated_cooking_time, 10)
                : null,
        };

        setFormLoading(true);
        try {
            if (editMode && selectedRecipe) {
                const res = await updateRecipe(selectedRecipe._id, payload);
                setSelectedRecipe(res.data);
                setView(VIEW.DETAIL);
            } else {
                const res = await createRecipe(payload);
                setSelectedRecipe(res.data);
                setView(VIEW.DETAIL);
            }
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to save recipe.';
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setFormLoading(false);
        }
    };

    const isOwner = (recipe) =>
        user && recipe && (recipe.created_by === user._id || recipe.created_by === user.id);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="recipe-page">

            {/* Header */}
            <div className="recipe-page-header" style={{ justifyContent: 'center' }}>
                <div className="recipe-page-header-text" style={{ textAlign: 'center' }}>
                    <h1 className="recipe-page-title">Recipe Repository</h1>
                    <p className="recipe-page-subtitle">Browse, search, and manage your recipes</p>
                </div>
            </div>

            {/* Top Navigation */}
            <div className="recipe-tabs-container premium-nav-bar">
                <div className="recipe-tabs align-side-by-side" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', padding: '0.5rem', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    <button
                        className={`recipe-tab ${view === VIEW.LIST && activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => { setView(VIEW.LIST); setActiveTab('all'); setSkip(0); }}
                        style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.8rem 1.5rem' }}
                    >
                        <span>📖</span> View Recipes
                    </button>
                    {user && (
                        <button
                            className={`recipe-tab ${view === VIEW.LIST && activeTab === 'mine' ? 'active' : ''}`}
                            onClick={() => { setView(VIEW.LIST); setActiveTab('mine'); setSkip(0); }}
                            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.8rem 1.5rem' }}
                        >
                            <span>🧑‍🍳</span> My Recipes
                        </button>
                    )}
                    {user && view === VIEW.LIST && (
                        <button
                            className="recipe-tab"
                            onClick={openCreate}
                            id="add-recipe-btn"
                            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.8rem 1.5rem' }}
                        >
                            <span className="add-icon" style={{ fontWeight: 'bold' }}>+</span> Add Recipe
                        </button>
                    )}
                    {view !== VIEW.LIST && (
                        <button
                            className="recipe-tab"
                            onClick={() => setView(editMode && view === VIEW.FORM ? VIEW.DETAIL : VIEW.LIST)}
                            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.8rem 1.5rem' }}
                        >
                            <span>←</span> Back
                        </button>
                    )}
                </div>
            </div>

            {/* ── LIST VIEW ── */}
            {view === VIEW.LIST && (
                <div>

                    {/* Filter Bar */}
                    <div className="filter-bar unified-filter-bar">
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                id="recipe-search"
                                className="filter-search premium-input"
                                type="text"
                                placeholder={`Search ${activeTab === 'mine' ? 'your' : 'all'} recipes...`}
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                            />
                        </div>
                        <select
                            id="category-filter"
                            className="filter-select premium-select"
                            value={categoryFilter}
                            onChange={e => { setCategoryFilter(e.target.value); setSkip(0); }}
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {error && <div className="error">{error}</div>}

                    {/* Grid */}
                    {loading ? (
                        <div className="loading-state">Loading recipes...</div>
                    ) : recipes.length === 0 ? (
                        <div className="empty-state">
                            <p className="empty-icon">—</p>
                            <p>No recipes found.</p>
                            {user && (
                                <button className="btn-primary" onClick={openCreate}>Create your first recipe</button>
                            )}
                        </div>
                    ) : (
                        <div className="recipe-grid">
                            {recipes.map(recipe => (
                                <div
                                    key={recipe._id}
                                    className="recipe-card"
                                    onClick={() => openDetail(recipe._id)}
                                    id={`recipe-card-${recipe._id}`}
                                >
                                    {/* Action Buttons */}
                                    {isOwner(recipe) && (
                                        <div className="recipe-card-actions" onClick={e => e.stopPropagation()}>
                                            <button 
                                                className="action-edit" 
                                                onClick={() => openEdit(recipe)}
                                                title="Edit Recipe"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                className="action-delete" 
                                                onClick={(e) => handleDelete(recipe, e)}
                                                title="Delete Recipe"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}

                                    {/* Recipe Image */}
                                    <div className="recipe-card-img-wrapper">
                                        {recipe.image_url ? (
                                            <img
                                                src={recipe.image_url.startsWith('/') ? `http://localhost:8001${recipe.image_url}` : recipe.image_url}
                                                alt={recipe.title}
                                                className="recipe-card-img"
                                                onError={e => { e.target.parentElement.innerHTML = '<div class="recipe-card-placeholder"></div>'; }}
                                            />
                                        ) : (
                                            <div className="recipe-card-placeholder"></div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="recipe-card-body">
                                        <div className="recipe-card-category">
                                            <span className={`badge badge-${recipe.category}`}>
                                                {recipe.category}
                                            </span>
                                        </div>

                                        <h3 className="recipe-card-title">{recipe.title}</h3>
                                        
                                        {recipe.description && (
                                            <p className="recipe-card-desc">
                                                {recipe.description}
                                            </p>
                                        )}

                                        <div className="recipe-card-meta">
                                            {recipe.estimated_cooking_time && (
                                                <div className="meta-item">
                                                    <span className="meta-icon">⏱️</span>
                                                    <span>{recipe.estimated_cooking_time} min</span>
                                                </div>
                                            )}
                                            <div className="meta-item">
                                                <span className="meta-icon">🧂</span>
                                                <span>{recipe.ingredients.length} Ingred.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && (recipes.length === LIMIT || skip > 0) && (
                        <div className="pagination">
                            <button
                                className="btn-page"
                                onClick={() => setSkip(Math.max(0, skip - LIMIT))}
                                disabled={skip === 0}
                            >
                                ← Previous
                            </button>
                            <span className="page-info">Page {Math.floor(skip / LIMIT) + 1}</span>
                            <button
                                className="btn-page"
                                onClick={() => setSkip(skip + LIMIT)}
                                disabled={recipes.length < LIMIT}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── DETAIL VIEW ── */}
            {view === VIEW.DETAIL && selectedRecipe && (
                <div className="recipe-detail">

                    {selectedRecipe.image_url && (
                        <img
                            src={selectedRecipe.image_url.startsWith('/') ? `http://localhost:8001${selectedRecipe.image_url}` : selectedRecipe.image_url}
                            alt={selectedRecipe.title}
                            className="recipe-hero-img"
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                    )}

                    <div className="recipe-detail-header">
                        <div>
                            <span className={`badge badge-${selectedRecipe.category} badge-lg`}>
                                {selectedRecipe.category}
                            </span>
                            <h1 className="recipe-detail-title">{selectedRecipe.title}</h1>
                            {selectedRecipe.description && (
                                <p className="recipe-detail-desc">{selectedRecipe.description}</p>
                            )}
                            <div className="recipe-meta">
                                {selectedRecipe.estimated_cooking_time && (
                                    <span>{selectedRecipe.estimated_cooking_time} min cook time</span>
                                )}
                                <span>{selectedRecipe.ingredients.length} ingredients</span>
                                <span>{selectedRecipe.preparation_steps.length} steps</span>
                            </div>
                        </div>

                        {isOwner(selectedRecipe) && (
                            <div className="recipe-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => openEdit(selectedRecipe)}
                                    id="edit-recipe-btn"
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn-danger"
                                    onClick={() => handleDelete(selectedRecipe)}
                                    id="delete-recipe-btn"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {error && <div className="error">{error}</div>}

                    {/* Dietary Tags */}
                    {selectedRecipe.dietary_tags?.length > 0 && (
                        <div className="tag-chips" style={{ marginBottom: '1.5rem' }}>
                            {selectedRecipe.dietary_tags.map(tag => (
                                <span key={tag} className="tag-chip">{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Ingredients */}
                    <section className="recipe-section">
                        <h2>Ingredients</h2>
                        <table className="ingredient-table">
                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedRecipe.ingredients.map((ing, i) => (
                                    <tr key={i}>
                                        <td>{ing.name}</td>
                                        <td>{ing.quantity}</td>
                                        <td>{ing.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Preparation Steps */}
                    <section className="recipe-section">
                        <h2>Preparation Steps</h2>
                        <ol className="steps-list">
                            {selectedRecipe.preparation_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ol>
                    </section>
                </div>
            )}

            {/* ── FORM VIEW ── */}
            {view === VIEW.FORM && (
                <div className="recipe-form-wrapper">
                    <h1 className="recipe-page-title">{editMode ? 'Edit Recipe' : 'Add New Recipe'}</h1>

                    <form onSubmit={handleSubmit} className="recipe-form" id="recipe-form">
                        {formError && <div className="error">{formError}</div>}

                        {/* Title */}
                        <div className="form-group">
                            <label htmlFor="recipe-title">Title *</label>
                            <input
                                id="recipe-title"
                                type="text"
                                placeholder="e.g. Avocado Toast"
                                value={form.title}
                                onChange={e => setFormField('title', e.target.value)}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label htmlFor="recipe-desc">Description</label>
                            <textarea
                                id="recipe-desc"
                                className="form-textarea"
                                placeholder="Brief description of the recipe..."
                                value={form.description}
                                onChange={e => setFormField('description', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Category */}
                        <div className="form-group">
                            <label htmlFor="recipe-category">Category *</label>
                            <select
                                id="recipe-category"
                                className="form-select"
                                value={form.category}
                                onChange={e => setFormField('category', e.target.value)}
                                required
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Cook Time */}
                        <div className="form-group">
                            <label htmlFor="recipe-time">Estimated Cooking Time (minutes)</label>
                            <input
                                id="recipe-time"
                                type="number"
                                min="1"
                                placeholder="e.g. 30"
                                value={form.estimated_cooking_time}
                                onChange={e => setFormField('estimated_cooking_time', e.target.value)}
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="form-group">
                            <label htmlFor="recipe-image">Recipe Image</label>
                            <input
                                id="recipe-image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleImageUpload}
                                className="file-input"
                                disabled={imageUploading}
                            />
                            {imageUploading && (
                                <p className="upload-status">Uploading image...</p>
                            )}
                            {form.image_url && !imageUploading && (
                                <div className="img-preview-wrapper">
                                    <img
                                        src={`http://localhost:8001${form.image_url}`}
                                        alt="Preview"
                                        className="img-preview"
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Dietary Tags */}
                        <div className="form-group">
                            <label htmlFor="recipe-tags">Dietary Tags (comma-separated)</label>
                            <input
                                id="recipe-tags"
                                type="text"
                                placeholder="e.g. vegan, gluten-free, low-carb"
                                value={form.dietary_tags}
                                onChange={e => setFormField('dietary_tags', e.target.value)}
                            />
                        </div>

                        {/* Ingredients */}
                        <div className="form-section">
                            <div className="form-section-header">
                                <h3>Ingredients *</h3>
                                <button type="button" className="btn-add-row" onClick={addIngredient}>
                                    + Add Ingredient
                                </button>
                            </div>
                            {form.ingredients.map((ing, idx) => (
                                <div key={idx} className="ingredient-row">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={ing.name}
                                        onChange={e => setIngredient(idx, 'name', e.target.value)}
                                        className="ing-name"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        min="0"
                                        step="any"
                                        value={ing.quantity}
                                        onChange={e => setIngredient(idx, 'quantity', e.target.value)}
                                        className="ing-qty"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Unit"
                                        value={ing.unit}
                                        onChange={e => setIngredient(idx, 'unit', e.target.value)}
                                        className="ing-unit"
                                    />
                                    {form.ingredients.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-remove-row"
                                            onClick={() => removeIngredient(idx)}
                                            title="Remove ingredient"
                                        >
                                            x
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Preparation Steps */}
                        <div className="form-section">
                            <div className="form-section-header">
                                <h3>Preparation Steps *</h3>
                                <button type="button" className="btn-add-row" onClick={addStep}>
                                    + Add Step
                                </button>
                            </div>
                            {form.preparation_steps.map((step, idx) => (
                                <div key={idx} className="step-row">
                                    <span className="step-num">{idx + 1}</span>
                                    <textarea
                                        className="form-textarea step-input"
                                        placeholder={`Step ${idx + 1}...`}
                                        value={step}
                                        onChange={e => setStep(idx, e.target.value)}
                                        rows={2}
                                    />
                                    {form.preparation_steps.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-remove-row"
                                            onClick={() => removeStep(idx)}
                                            title="Remove step"
                                        >
                                            x
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Submit */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setView(editMode ? VIEW.DETAIL : VIEW.LIST)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={formLoading} id="submit-recipe-btn">
                                {formLoading ? 'Saving…' : editMode ? 'Update Recipe' : 'Create Recipe'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default RecipeManagement;
