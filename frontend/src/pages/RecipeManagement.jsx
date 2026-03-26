import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
} from '../services/recipeService';

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
    const [skip, setSkip] = useState(0);
    const LIMIT = 12;

    // Form state
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setSkip(0);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

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

            const res = await getRecipes(params);
            setRecipes(res.data);
        } catch (err) {
            console.error('Fetch recipes error:', err);
            setError('Failed to load recipes. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter, skip]);

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
        recipe && recipe.created_by === '1'; // Mock

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div>
            <Navbar />
            <div style={{padding:"30px",maxWidth:"1200px",margin:"auto"}}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{color:"#16a34a"}}>Recipe Repository</h1>
                    <p>Browse, search, and manage your recipes</p>
                </div>

                {/* Top Navigation */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', padding: '0.5rem', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    <button
                        style={{
                            width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.8rem 1.5rem',
                            background: view === VIEW.LIST ? '#16a34a' : '#f0fdf4', color: view === VIEW.LIST ? 'white' : '#16a34a', border: '1px solid #16a34a', cursor: 'pointer'
                        }}
                        onClick={() => { setView(VIEW.LIST); setSkip(0); }}
                    >
                        📖 View Recipes
                    </button>
                    <button
                        style={{
                            width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.8rem 1.5rem',
                            background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer'
                        }}
                        onClick={openCreate}
                    >
                        + Add Recipe
                    </button>
                    {view !== VIEW.LIST && (
                        <button
                            style={{
                                width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.8rem 1.5rem',
                                background: '#f97316', color: 'white', border: 'none', cursor: 'pointer'
                            }}
                            onClick={() => setView(editMode && view === VIEW.FORM ? VIEW.DETAIL : VIEW.LIST)}
                        >
                            ← Back
                        </button>
                    )}
                </div>

                {/* ── LIST VIEW ── */}
                {view === VIEW.LIST && (
                    <div>

                        {/* Filter Bar */}
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Search recipes..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                style={{ padding: '0.5rem', flex: 1 }}
                            />
                            <select
                                value={categoryFilter}
                                onChange={e => { setCategoryFilter(e.target.value); setSkip(0); }}
                                style={{ padding: '0.5rem' }}
                            >
                                <option value="">All Categories</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        {error && <div style={{ color: 'red' }}>{error}</div>}

                        {/* Grid */}
                        {loading ? (
                            <div>Loading recipes...</div>
                        ) : recipes.length === 0 ? (
                            <div>
                                <p>No recipes found.</p>
                                <button onClick={openCreate}>Create your first recipe</button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {recipes.map(recipe => (
                                    <div
                                        key={recipe._id}
                                        style={{ border: '1px solid #ccc', padding: '1rem', cursor: 'pointer' }}
                                        onClick={() => openDetail(recipe._id)}
                                    >
                                        {/* Action Buttons */}
                                        {isOwner(recipe) && (
                                            <div style={{ float: 'right' }} onClick={e => e.stopPropagation()}>
                                                <button onClick={() => openEdit(recipe)}>Edit</button>
                                                <button onClick={(e) => handleDelete(recipe, e)}>Delete</button>
                                            </div>
                                        )}

                                        <h3>{recipe.title}</h3>
                                        <p>{recipe.category}</p>
                                        <p>{recipe.ingredients.length} ingredients</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && (recipes.length === LIMIT || skip > 0) && (
                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    onClick={() => setSkip(Math.max(0, skip - LIMIT))}
                                    disabled={skip === 0}
                                >
                                    Previous
                                </button>
                                <span>Page {Math.floor(skip / LIMIT) + 1}</span>
                                <button
                                    onClick={() => setSkip(skip + LIMIT)}
                                    disabled={recipes.length < LIMIT}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── DETAIL VIEW ── */}
                {view === VIEW.DETAIL && selectedRecipe && (
                    <div>
                        <h1>{selectedRecipe.title}</h1>
                        <p>{selectedRecipe.description}</p>
                        <p>Category: {selectedRecipe.category}</p>
                        <h2>Ingredients</h2>
                        <ul>
                            {selectedRecipe.ingredients.map((ing, i) => (
                                <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>
                            ))}
                        </ul>
                        <h2>Steps</h2>
                        <ol>
                            {selectedRecipe.preparation_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ol>
                        {isOwner(selectedRecipe) && (
                            <div>
                                <button onClick={() => openEdit(selectedRecipe)}>Edit</button>
                                <button onClick={() => handleDelete(selectedRecipe)}>Delete</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── FORM VIEW ── */}
                {view === VIEW.FORM && (
                    <div>
                        <h1>{editMode ? 'Edit Recipe' : 'Add New Recipe'}</h1>

                        <form onSubmit={handleSubmit}>
                            {formError && <div style={{ color: 'red' }}>{formError}</div>}

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setFormField('title', e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setFormField('description', e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Category *</label>
                                <select
                                    value={form.category}
                                    onChange={e => setFormField('category', e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem' }}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Cook Time (minutes)</label>
                                <input
                                    type="number"
                                    value={form.estimated_cooking_time}
                                    onChange={e => setFormField('estimated_cooking_time', e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Dietary Tags</label>
                                <input
                                    type="text"
                                    value={form.dietary_tags}
                                    onChange={e => setFormField('dietary_tags', e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <h3>Ingredients *</h3>
                                {form.ingredients.map((ing, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={ing.name}
                                            onChange={e => setIngredient(idx, 'name', e.target.value)}
                                            style={{ flex: 1, padding: '0.5rem' }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={ing.quantity}
                                            onChange={e => setIngredient(idx, 'quantity', e.target.value)}
                                            style={{ width: '80px', padding: '0.5rem' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Unit"
                                            value={ing.unit}
                                            onChange={e => setIngredient(idx, 'unit', e.target.value)}
                                            style={{ width: '80px', padding: '0.5rem' }}
                                        />
                                        {form.ingredients.length > 1 && (
                                            <button type="button" onClick={() => removeIngredient(idx)}>x</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addIngredient}>+ Add Ingredient</button>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <h3>Preparation Steps *</h3>
                                {form.preparation_steps.map((step, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span>{idx + 1}.</span>
                                        <textarea
                                            value={step}
                                            onChange={e => setStep(idx, e.target.value)}
                                            rows={2}
                                            style={{ flex: 1, padding: '0.5rem' }}
                                        />
                                        {form.preparation_steps.length > 1 && (
                                            <button type="button" onClick={() => removeStep(idx)}>x</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addStep}>+ Add Step</button>
                            </div>

                            <div>
                                <button type="submit" disabled={formLoading} style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none' }}>
                                    {formLoading ? 'Saving…' : editMode ? 'Update Recipe' : 'Create Recipe'}
                                </button>
                                <button type="button" onClick={() => setView(editMode ? VIEW.DETAIL : VIEW.LIST)} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecipeManagement;