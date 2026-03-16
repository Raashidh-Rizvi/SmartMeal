import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getRecipes, deleteRecipe } from '../../api/recipes';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'];

function MyRecipes() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const userId = user?.id || user?._id;

    const fetchMyRecipes = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError('');
        try {
            const params = { created_by: userId, limit: 100 };
            if (search) params.search = search;
            if (categoryFilter) params.category = categoryFilter;
            const res = await getRecipes(params);
            setRecipes(res.data);
        } catch {
            setError('Failed to load your recipes.');
        } finally {
            setLoading(false);
        }
    }, [userId, search, categoryFilter]);

    useEffect(() => { fetchMyRecipes(); }, [fetchMyRecipes]);

    const handleDelete = async (recipe) => {
        try {
            await deleteRecipe(recipe._id);
            setDeleteConfirm(null);
            setRecipes(prev => prev.filter(r => r._id !== recipe._id));
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete recipe.');
        }
    };

    const total = recipes.length;
    const byCat = CATEGORIES.reduce((acc, c) => {
        acc[c] = recipes.filter(r => r.category === c).length;
        return acc;
    }, {});

    const imgSrc = (url) =>
        url ? (url.startsWith('/') ? `http://localhost:8001${url}` : url) : null;

    return (
        <div className="my-recipes-page">
            {/* Hero */}
            <div className="my-recipes-hero">
                <div className="my-recipes-hero-text">
                    <h1>My Recipe Book</h1>
                    <p>Your personal collection of recipes, all in one place.</p>
                </div>
                <button
                    className="btn-hero"
                    onClick={() => navigate('/recipes', { state: { openCreate: true } })}
                    id="create-recipe-btn"
                >
                    + Create New Recipe
                </button>
            </div>

            {/* Stats Bar */}
            <div className="my-recipes-stats">
                <div className="stat-card">
                    <span className="stat-num">{total}</span>
                    <span className="stat-label">Total</span>
                </div>
                {CATEGORIES.map(c => (
                    <div
                        key={c}
                        className={`stat-card stat-cat${categoryFilter === c ? ' stat-cat-active' : ''}`}
                        onClick={() => setCategoryFilter(cat => cat === c ? '' : c)}
                        title={`Filter by ${c}`}
                    >
                        <span className="stat-num">{byCat[c]}</span>
                        <span className="stat-label">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="my-recipes-search-row">
                <input
                    id="my-recipes-search"
                    className="filter-search"
                    type="text"
                    placeholder="Search your recipes..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    style={{ flex: 1 }}
                />
                {categoryFilter && (
                    <button className="btn-filter active" onClick={() => setCategoryFilter('')}>
                        Clear filter
                    </button>
                )}
            </div>

            {error && <div className="error">{error}</div>}

            {/* List */}
            {loading ? (
                <div className="loading-state">Loading your recipes...</div>
            ) : recipes.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-icon">—</p>
                    <p>{search || categoryFilter ? 'No recipes match your filter.' : "You haven't created any recipes yet."}</p>
                    <button className="btn-primary" onClick={() => navigate('/recipes', { state: { openCreate: true } })}>
                        Create Your First Recipe
                    </button>
                </div>
            ) : (
                <div className="my-recipes-list">
                    {recipes.map(recipe => (
                        <div key={recipe._id} className="my-recipe-row" id={`my-recipe-${recipe._id}`}>
                            {/* Thumbnail */}
                            <div className="my-recipe-thumb">
                                {imgSrc(recipe.image_url) ? (
                                    <img
                                        src={imgSrc(recipe.image_url)}
                                        alt={recipe.title}
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <span className="my-recipe-thumb-placeholder">
                                        {recipe.category?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="my-recipe-info">
                                <div className="my-recipe-top">
                                    <span className={`badge badge-${recipe.category}`}>{recipe.category}</span>
                                    {recipe.estimated_cooking_time && (
                                        <span className="recipe-time">{recipe.estimated_cooking_time} min</span>
                                    )}
                                </div>
                                <h3 className="my-recipe-title">{recipe.title}</h3>
                                {recipe.description && (
                                    <p className="my-recipe-desc">
                                        {recipe.description.slice(0, 120)}{recipe.description.length > 120 ? '...' : ''}
                                    </p>
                                )}
                                <div className="my-recipe-meta">
                                    <span>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
                                    <span>{recipe.preparation_steps.length} steps</span>
                                    {recipe.dietary_tags?.slice(0, 2).map(t => (
                                        <span key={t} className="tag-chip">{t}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="my-recipe-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate('/recipes')}
                                    id={`view-${recipe._id}`}
                                >
                                    View
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate('/recipes', { state: { editId: recipe._id } })}
                                    id={`edit-${recipe._id}`}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn-danger"
                                    onClick={() => setDeleteConfirm(recipe)}
                                    id={`delete-${recipe._id}`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Delete Recipe?</h3>
                        <p>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyRecipes;
