import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    uploadRecipeImage,
    toggleFavoriteRecipe,
    getFavoriteRecipes,
} from '../../api/recipes';
import api from '../../api/axios';
import './recipes.css';
import {
    Pencil,
    Trash2,
    ArrowLeft,
    Plus,
    Search,
    Clock,
    Users,
    ChefHat,
    BookOpen,
    User,
    Check,
    Heart,
    UtensilsCrossed,
    Flame,
    Leaf
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'];
const UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs', 'Piece', 'Pack', 'Dozen', 'slice', 'bottle', 'jar', 'cup', 'tbsp', 'tsp', 'pinch'];

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
const INGREDIENT_FETCH_LIMIT = 500;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

const normalizeIngredientName = (name) => String(name || '').trim().toLowerCase();

// ─── View Enum ────────────────────────────────────────────────────────────────
const VIEW = { LIST: 'list', DETAIL: 'detail', FORM: 'form' };

// ─────────────────────────────────────────────────────────────────────────────
function RecipeManagement() {
    const { user, setUser } = useContext(AuthContext);
    const location = useLocation();
    const currentUserId = useMemo(() => {
        const rawId = user?._id ?? user?.id;
        return rawId ? String(rawId) : '';
    }, [user]);

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
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'mine', or 'favorites'
    const [skip, setSkip] = useState(0);
    const LIMIT = 12;

    // Form state
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [availableIngredients, setAvailableIngredients] = useState([]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setSkip(0);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Check for URL parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        // Tab/Filter parameters
        if (params.get('tab') === 'mine' || params.get('created_by_me') === '1') {
            setActiveTab('mine');
        } else if (params.get('tab') === 'favorites') {
            setActiveTab('favorites');
        }

        // Search parameter
        const searchParam = params.get('search');
        if (searchParam) {
            setSearchInput(searchParam);
            setSearch(searchParam);
            setSkip(0);
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

    const ingredientOptions = useMemo(() => {
        const byName = new Map();
        for (const item of availableIngredients) {
            const name = String(item?.name || '').trim();
            if (!name) continue;

            const key = normalizeIngredientName(name);
            if (!byName.has(key)) {
                byName.set(key, {
                    ...item,
                    name,
                    unit: String(item?.unit || '').trim(),
                    category: String(item?.category || '').trim(),
                });
            }
        }

        return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [availableIngredients]);

    const findIngredientOption = useCallback((name) => {
        const key = normalizeIngredientName(name);
        return ingredientOptions.find(item => normalizeIngredientName(item.name) === key);
    }, [ingredientOptions]);

    // ── Fetch Ingredient Management items for recipe ingredient suggestions ──
    useEffect(() => {
        if (view !== VIEW.FORM) return;

        let cancelled = false;

        api.get('/api/admin/ingredients', { params: { page: 1, limit: INGREDIENT_FETCH_LIMIT } })
            .then(res => {
                if (!cancelled) {
                    setAvailableIngredients(Array.isArray(res.data?.items) ? res.data.items : []);
                }
            })
            .catch(() => {
                if (!cancelled) setAvailableIngredients([]);
            });

        return () => {
            cancelled = true;
        };
    }, [view]);

    // ── Fetch recipes list ───────────────────────────────────────────────────
    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const normalizedSearch = search.trim();

            if (activeTab === 'favorites') {
                if (!user) {
                    setRecipes([]);
                    return;
                }

                const res = await getFavoriteRecipes();
                const favoriteRecipes = Array.isArray(res.data) ? res.data : [];
                const normalizedFavoriteSearch = normalizedSearch.toLowerCase();

                const filteredFavorites = favoriteRecipes.filter(recipe => {
                    const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
                    if (!matchesCategory) return false;

                    if (!normalizedFavoriteSearch) return true;

                    const haystacks = [
                        recipe.title,
                        recipe.description,
                        ...(Array.isArray(recipe.ingredients) ? recipe.ingredients.map(ingredient => ingredient?.name) : []),
                    ];

                    return haystacks.some(value =>
                        String(value || '').toLowerCase().includes(normalizedFavoriteSearch)
                    );
                });

                setRecipes(filteredFavorites);
                return;
            }

            if (activeTab === 'mine' && !currentUserId) {
                setRecipes([]);
                return;
            }

            const params = { skip, limit: LIMIT };
            if (normalizedSearch) params.search = normalizedSearch;
            if (categoryFilter) params.category = categoryFilter;
            if (activeTab === 'mine') params.created_by = currentUserId;

            const res = await getRecipes(params);
            setRecipes(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Fetch recipes error:', err);
            setError('Failed to load recipes. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter, activeTab, skip, currentUserId, user]);

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

    const isOwner = useCallback((recipe) => (
        Boolean(recipe?.created_by && currentUserId && String(recipe.created_by) === currentUserId)
    ), [currentUserId]);

    const isFavorited = (recipeId) => (
        Array.isArray(user?.favoriteRecipes)
            ? user.favoriteRecipes.some(id => String(id) === String(recipeId))
            : false
    );

    const handleToggleFavorite = async (recipeId, e) => {
        if (e) e.stopPropagation();
        if (!user) return;

        try {
            const res = await toggleFavoriteRecipe(recipeId);
            const newFavorites = Array.isArray(res.data?.favorites) ? res.data.favorites : [];

            if (typeof setUser === 'function') {
                setUser(prev => (prev ? { ...prev, favoriteRecipes: newFavorites } : prev));
            }

            if (activeTab === 'favorites') {
                fetchRecipes();
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    // ── Open edit form ───────────────────────────────────────────────────────
    const openEdit = (recipe) => {
        if (!isOwner(recipe)) {
            setError('You can only edit recipes you created.');
            return;
        }

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
        if (!isOwner(recipe)) {
            setError('You can only delete recipes you created.');
            return;
        }
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

    // Suggestions come from Ingredient Management, but free-typed ingredients stay valid.
    const handleIngredientNameChange = (idx, name) => {
        const match = findIngredientOption(name);
        setForm(prev => {
            const ingredients = [...prev.ingredients];
            ingredients[idx] = {
                ...ingredients[idx],
                name,
                unit: match?.unit || ingredients[idx].unit,
            };
            return { ...prev, ingredients };
        });
    };

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
            if (!ing.unit)
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

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="recipe-page">

            {/* Header */}
            <div className="recipe-page-header page-hero page-hero--sub">
                {/* Decorative Background Icons - Scattered */}
                <UtensilsCrossed size={48} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '35%', left: '5%', '--rotation': '-18deg' }} />
                <ChefHat size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '30%', left: '35%', '--rotation': '12deg', animationDelay: '0.8s' }} />
                <Flame size={44} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '18%', '--rotation': '22deg', animationDelay: '1.5s' }} />
                <Leaf size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '32%', right: '7%', '--rotation': '-8deg', animationDelay: '2.3s' }} />

                <BookOpen size={48} color="#10b981" style={{ position: 'relative', zIndex: 1 }} />
                <div className="recipe-page-header-text" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <h1 className="recipe-page-title" style={{ margin: 0 }}>Recipe Repository</h1>
                    <p className="recipe-page-subtitle" style={{ margin: '0.5rem 0 0 0' }}>Browse, search, and manage your recipes</p>
                </div>
            </div>

            {/* Top Navigation */}
            <div className="recipe-tabs-container premium-nav-bar">
                <div className="recipe-tabs align-side-by-side">
                    <button
                        className={`recipe-tab ${view === VIEW.LIST && activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => { setView(VIEW.LIST); setActiveTab('all'); setSkip(0); }}
                    >
                        <Search size={18} /> View Recipes
                    </button>
                    {user && (
                        <button
                            className={`recipe-tab ${view === VIEW.LIST && activeTab === 'mine' ? 'active' : ''}`}
                            onClick={() => { setView(VIEW.LIST); setActiveTab('mine'); setSkip(0); }}
                        >
                            <User size={18} /> My Recipes
                        </button>
                    )}
                    {user && (
                        <button
                            className={`recipe-tab ${view === VIEW.LIST && activeTab === 'favorites' ? 'active' : ''}`}
                            onClick={() => { setView(VIEW.LIST); setActiveTab('favorites'); setSkip(0); }}
                        >
                            <Heart size={18} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} /> Favorites
                        </button>
                    )}
                    {user && view === VIEW.LIST && (
                        <button
                            className="recipe-tab"
                            onClick={openCreate}
                            id="add-recipe-btn"
                        >
                            <Plus size={18} /> Add Recipe
                        </button>
                    )}
                    {view !== VIEW.LIST && (
                        <button
                            className="recipe-tab"
                            onClick={() => setView(editMode && view === VIEW.FORM ? VIEW.DETAIL : VIEW.LIST)}
                        >
                            <ArrowLeft size={18} /> Back
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
                            <Search className="search-icon" size={18} />
                            <input
                                id="recipe-search"
                                className="filter-search premium-input"
                                type="text"
                                placeholder={`Search ${activeTab === 'mine' ? 'your' : activeTab === 'favorites' ? 'favorite' : 'all'} recipes...`}
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
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading recipes...</p>
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="empty-state">
                            <Search size={48} color="#cbd5e1" className="empty-state-icon" />
                            <p className="empty-state-title">
                                {activeTab === 'favorites' ? 'No favorite recipes found.' : 'No recipes found.'}
                            </p>
                            {user && (
                                <button className="btn-primary empty-state-action" onClick={openCreate}>Create your first recipe</button>
                            )}
                        </div>
                    ) : (
                        <div className="recipe-grid">
                            {recipes.map(recipe => {
                                const ownsRecipe = isOwner(recipe);

                                return (
                                    <div
                                        key={recipe._id}
                                        className="recipe-card"
                                        onClick={() => openDetail(recipe._id)}
                                        id={`recipe-card-${recipe._id}`}
                                    >
                                        <div className="recipe-card-img-wrapper">
                                            {user && (
                                                <button
                                                    className={`favorite-btn ${isFavorited(recipe._id) ? 'favorited' : ''}`}
                                                    onClick={(e) => handleToggleFavorite(recipe._id, e)}
                                                    title={isFavorited(recipe._id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                                    aria-label={isFavorited(recipe._id) ? `Remove ${recipe.title} from favorites` : `Add ${recipe.title} to favorites`}
                                                >
                                                    <Heart size={18} fill={isFavorited(recipe._id) ? 'currentColor' : 'none'} />
                                                </button>
                                            )}

                                            {ownsRecipe && (
                                                <div
                                                    className="recipe-card-overlay-actions"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <button
                                                        className="recipe-card-icon-action action-edit-icon"
                                                        onClick={() => openEdit(recipe)}
                                                        title="Edit Recipe"
                                                        aria-label={`Edit ${recipe.title}`}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        className="recipe-card-icon-action action-delete-icon"
                                                        onClick={(e) => handleDelete(recipe, e)}
                                                        title="Delete Recipe"
                                                        aria-label={`Delete ${recipe.title}`}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}

                                            {recipe.image_url ? (
                                                <img
                                                    src={recipe.image_url.startsWith('/') ? `${API_BASE_URL}${recipe.image_url}` : recipe.image_url}
                                                    alt={recipe.title}
                                                    className="recipe-card-img"
                                                    onError={e => {
                                                        e.target.style.display = 'none';
                                                        const placeholder = e.target.nextElementSibling;
                                                        if (placeholder) placeholder.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="recipe-card-placeholder"
                                                style={{ display: recipe.image_url ? 'none' : 'flex' }}
                                            >
                                                <BookOpen size={48} color="#e2e8f0" />
                                            </div>
                                        </div>

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
                                                        <Clock size={14} />
                                                        <span>{recipe.estimated_cooking_time} min</span>
                                                    </div>
                                                )}
                                                <div className="meta-item">
                                                    <Users size={14} />
                                                    <span>{recipe.ingredients.length} Ingred.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
                                <ArrowLeft size={16} /> Previous
                            </button>
                            <span className="page-info">Page {Math.floor(skip / LIMIT) + 1}</span>
                            <button
                                className="btn-page"
                                onClick={() => setSkip(skip + LIMIT)}
                                disabled={recipes.length < LIMIT}
                            >
                                Next <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
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
                            src={selectedRecipe.image_url.startsWith('/') ? `${API_BASE_URL}${selectedRecipe.image_url}` : selectedRecipe.image_url}
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
                                    <div className="recipe-meta-item">
                                        <Clock size={18} color="var(--primary)" />
                                        <span>{selectedRecipe.estimated_cooking_time} min cook time</span>
                                    </div>
                                )}
                                <div className="recipe-meta-item">
                                    <Users size={18} color="var(--primary)" />
                                    <span>{selectedRecipe.ingredients.length} ingredients</span>
                                </div>
                                <div className="recipe-meta-item">
                                    <ChefHat size={18} color="var(--primary)" />
                                    <span>{selectedRecipe.preparation_steps.length} steps</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {error && <div className="error">{error}</div>}

                    {/* Dietary Tags */}
                    {selectedRecipe.dietary_tags?.length > 0 && (
                        <div className="tag-chips">
                            {selectedRecipe.dietary_tags.map(tag => (
                                <span key={tag} className="tag-chip">
                                    <Check size={12} /> {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Ingredients */}
                    <section className="recipe-section">
                        <h2 className="recipe-section-title">
                            <Users size={24} color="var(--primary)" /> Ingredients
                        </h2>
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
                        <h2 className="recipe-section-title">
                            <ChefHat size={24} color="var(--primary)" /> Preparation Steps
                        </h2>
                        <ol className="steps-list">
                            {selectedRecipe.preparation_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ol>
                    </section>

                    {/* Action Buttons (Moved to Bottom) */}
                    {isOwner(selectedRecipe) && (
                        <div className="recipe-detail-actions-footer">
                            <button
                                className="action-edit detail-action-btn"
                                onClick={() => openEdit(selectedRecipe)}
                                id="edit-recipe-btn"
                            >
                                <Pencil size={18} /> Edit
                            </button>
                            <button
                                className="action-delete detail-action-btn"
                                onClick={() => handleDelete(selectedRecipe)}
                                id="delete-recipe-btn"
                            >
                                <Trash2 size={18} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── FORM VIEW ── */}
            {view === VIEW.FORM && (
                <div className="recipe-form-wrapper">
                    <h1 className="recipe-page-title recipe-form-title">
                        {editMode ? <Pencil size={32} /> : <Plus size={32} />}
                        {editMode ? 'Edit Recipe' : 'Add New Recipe'}
                    </h1>

                    <form onSubmit={handleSubmit} className="recipe-form" id="recipe-form">
                        {formError && <div className="error">{formError}</div>}

                        {/* Row 1: Title and Category */}
                        <div className="recipe-form-row">
                            <div className="form-group recipe-form-group recipe-form-group--wide">
                                <label htmlFor="recipe-title">Title</label>
                                <input
                                    id="recipe-title"
                                    type="text"
                                    placeholder="e.g. Avocado Toast"
                                    value={form.title}
                                    onChange={e => setFormField('title', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group recipe-form-group recipe-form-group--narrow">
                                <label htmlFor="recipe-category">Category</label>
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
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label htmlFor="recipe-desc">Description</label>
                            <textarea
                                id="recipe-desc"
                                className="form-textarea"
                                placeholder="Write a detailed description of the recipe..."
                                value={form.description}
                                onChange={e => setFormField('description', e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Cook Time */}
                        <div className="form-group recipe-form-group recipe-time-group">
                            <label htmlFor="recipe-time">Cook Time (min)</label>
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
                                        src={form.image_url.startsWith('/') ? `${API_BASE_URL}${form.image_url}` : form.image_url}
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
                                <h3>Ingredients</h3>
                                <button type="button" className="btn-add-row" onClick={addIngredient}>
                                    <Plus size={16} /> Add Ingredient
                                </button>
                            </div>
                            <datalist id="recipe-ingredient-options">
                                {ingredientOptions.map(item => (
                                    <option
                                        key={item._id || item.name}
                                        value={item.name}
                                        label={[item.category, item.unit].filter(Boolean).join(' - ')}
                                    />
                                ))}
                            </datalist>
                            {form.ingredients.map((ing, idx) => {
                                return (
                                <div key={idx} className="ingredient-row">
                                    <input
                                        type="text"
                                        list="recipe-ingredient-options"
                                        value={ing.name}
                                        onChange={e => handleIngredientNameChange(idx, e.target.value)}
                                        className="ing-name"
                                        placeholder={ingredientOptions.length ? 'Choose or type ingredient' : 'Ingredient name'}
                                        required
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
                                        value={ing.unit || ''}
                                        onChange={e => setIngredient(idx, 'unit', e.target.value)}
                                        className="ing-unit"
                                        placeholder="Unit"
                                        required
                                    />
                                    {form.ingredients.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-remove-row"
                                            onClick={() => removeIngredient(idx)}
                                            title="Remove ingredient"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                                );
                            })}
                        </div>

                        {/* Preparation Steps */}
                        <div className="form-section">
                            <div className="form-section-header">
                                <h3>Preparation Steps</h3>
                                <button type="button" className="btn-add-row" onClick={addStep}>
                                    <Plus size={16} /> Add Step
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
                                            <Trash2 size={18} />
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
