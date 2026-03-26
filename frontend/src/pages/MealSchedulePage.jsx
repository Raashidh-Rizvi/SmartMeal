import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
    getMeals,
    createMeal,
    updateMeal,
    deleteMeal
} from "../services/mealService";
import { getRecipes, getRecipeById } from "../services/recipeService";
import "../styles/MealSchedulePage.css";

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Toast Component
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: "✔",
        error: "❌",
        warning: "⚠",
        info: "ℹ"
    };

    return (
        <div className={`toast toast-${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
}

// Tooltip Component
function Tooltip({ text, children }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="tooltip-wrapper">
            <div
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="tooltip-trigger"
            >
                {children}
            </div>
            {showTooltip && (
                <div className="tooltip-content">
                    {text}
                    <div className="tooltip-arrow"></div>
                </div>
            )}
        </div>
    );
}

// Form Field Component
function FormField({ label, error, children, required = false }) {
    return (
        <div className="form-field">
            <label className="form-label">
                {label}
                {required && <span className="required">*</span>}
            </label>
            {children}
            {error && <span className="field-error">{error}</span>}
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }) {
    const statusMap = {
        planned: { color: "#fbbf24", icon: "🟡", label: "Planned" },
        done: { color: "#34d399", icon: "🟢", label: "Done" },
        skipped: { color: "#f87171", icon: "🔴", label: "Skipped" }
    };
    const info = statusMap[status] || statusMap["planned"];
    return (
        <span className="status-badge" style={{ backgroundColor: info.color }}>
            {info.icon} {info.label}
        </span>
    );
}

// Confirmation Modal Component
function ConfirmModal({ title, message, onConfirm, onCancel, isDangerous = false }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className={`btn ${isDangerous ? "btn-danger" : "btn-primary"}`}
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

// Loading Skeleton Component
function MealRowSkeleton() {
    return (
        <tr className="skeleton-row">
            <td><div className="skeleton skeleton-text"></div></td>
            <td><div className="skeleton skeleton-text"></div></td>
            <td><div className="skeleton skeleton-text"></div></td>
            <td><div className="skeleton skeleton-badge"></div></td>
            <td><div className="skeleton skeleton-icon"></div></td>
            <td><div className="skeleton skeleton-buttons"></div></td>
        </tr>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MealSchedulePage() {
    // State Management
    const [meals, setMeals] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [form, setForm] = useState({
        meal_date: "",
        meal_type: "",
        recipe_id: "",
        status: "planned"
    });

    // Validation state
    const [formErrors, setFormErrors] = useState({});

    // Search and filter
    const [searchRecipe, setSearchRecipe] = useState("");
    const [filterMealType, setFilterMealType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const mealTypes = ["breakfast", "lunch", "dinner"];
    const statusOptions = ["planned", "done", "skipped", "cancelled"];

    // ─────────────────────────────────────────────────────────────────────────────
    // TOAST & VALIDATION HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    const addToast = (message, type = "info") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const validateForm = () => {
        const errors = {};

        if (!form.meal_date) {
            errors.meal_date = "Please select a date";
        }
        if (!form.meal_type) {
            errors.meal_type = "Please select meal type";
        }
        if (!form.recipe_id) {
            errors.recipe_id = "Please select a recipe";
        }

        // Check for duplicates
        if (form.meal_date && form.meal_type) {
            const isDuplicate = meals.some(
                m => m.meal_date === form.meal_date &&
                     m.meal_type === form.meal_type &&
                     m._id !== editingId
            );
            if (isDuplicate) {
                errors.duplicate = "Meal already planned for this date and type";
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const isFormValid = () => {
        return form.meal_date && form.meal_type && form.recipe_id && Object.keys(formErrors).length === 0;
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // API CALLS
    // ─────────────────────────────────────────────────────────────────────────────

    const loadMeals = async () => {
        try {
            setIsLoading(true);
            const res = await getMeals();
            setMeals(res.data || []);
        } catch (err) {
            console.error("Failed to load meals:", err);
            addToast("Failed to load meals", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const loadRecipes = async () => {
        try {
            const res = await getRecipes();
            setRecipes(res.data || []);
        } catch (err) {
            console.error("Failed to load recipes:", err);
            addToast("Failed to load recipes", "error");
        }
    };

    useEffect(() => {
        loadMeals();
        loadRecipes();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────────

    const handleFormChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            addToast("Please fill all required fields", "warning");
            return;
        }

        try {
            const payload = {
                user_id: "1",
                recipe_id: form.recipe_id,
                meal_date: form.meal_date,
                meal_type: form.meal_type,
                status: form.status
            };

            if (editingId) {
                await updateMeal(editingId, payload);
                addToast("Meal updated successfully ✨", "success");
            } else {
                await createMeal(payload);
                addToast("Meal created successfully 🎉", "success");
            }

            // Reset form
            setForm({
                meal_date: "",
                meal_type: "",
                recipe_id: "",
                status: "planned"
            });
            setFormErrors({});
            setEditingId(null);
            loadMeals();

        } catch (err) {
            const detail = err?.response?.data?.detail || "Operation failed";
            setFormErrors({ submit: detail });
            addToast(detail, "error");
        }
    };

    const handleEdit = (meal) => {
        setEditingId(meal._id);
        setForm({
            meal_date: meal.meal_date,
            meal_type: meal.meal_type,
            recipe_id: meal.recipe_id,
            status: meal.status || "planned"
        });
        setFormErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;

        try {
            await deleteMeal(deleteConfirm);
            addToast("Meal deleted successfully", "success");
            setDeleteConfirm(null);
            loadMeals();
        } catch (err) {
            addToast("Failed to delete meal", "error");
            console.error("Failed to delete meal:", err);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm({
            meal_date: "",
            meal_type: "",
            recipe_id: "",
            status: "planned"
        });
        setFormErrors({});
    };

    const viewRecipeDetails = async (recipeId) => {
        try {
            const res = await getRecipeById(recipeId);
            setSelectedRecipe(res.data);
        } catch (err) {
            console.error("Error loading recipe details:", err);
            addToast("Failed to load recipe details", "error");
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // FILTERS & SEARCH
    // ─────────────────────────────────────────────────────────────────────────────

    const filteredMeals = meals.filter(m => {
        const recipeMatch = !searchRecipe ||
            (m.recipe_title || getRecipeName(m.recipe_id)).toLowerCase().includes(searchRecipe.toLowerCase());
        const typeMatch = !filterMealType || m.meal_type === filterMealType;
        const statusMatch = !filterStatus || m.status === filterStatus;
        return recipeMatch && typeMatch && statusMatch;
    });

    const getRecipeName = (id) => {
        const recipe = recipes.find(r => r._id === id);
        return recipe ? recipe.title : "Unknown Recipe";
    };

    const resetFilters = () => {
        setSearchRecipe("");
        setFilterMealType("");
        setFilterStatus("");
    };

    // ═════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════════════

    return (
        <div className="meal-schedule-page">
            <Navbar />

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <ConfirmModal
                    title="Delete Meal"
                    message="Are you sure you want to delete this meal? This action cannot be undone."
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteConfirm(null)}
                    isDangerous={true}
                />
            )}

            {/* Main Content */}
            <div className="page-container">
                {/* Page Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">📅 Meal Schedule</h1>
                        <p className="page-subtitle">Plan and manage your daily meals efficiently</p>
                    </div>
                </div>

                {/* Create Meal Card */}
                <section className="create-meal-card">
                    <h2 className="card-title">
                        {editingId ? "✏️ Edit Meal Plan" : "+ Create New Meal"}
                    </h2>

                    <form onSubmit={handleSubmit} className="meal-form">
                        <div className="form-grid">
                            <FormField
                                label="Date"
                                error={formErrors.meal_date}
                                required
                            >
                                <input
                                    type="date"
                                    value={form.meal_date}
                                    onChange={e => handleFormChange("meal_date", e.target.value)}
                                    className={`form-input ${formErrors.meal_date ? "input-error" : ""}`}
                                />
                            </FormField>

                            <FormField
                                label="Meal Type"
                                error={formErrors.meal_type}
                                required
                            >
                                <select
                                    value={form.meal_type}
                                    onChange={e => handleFormChange("meal_type", e.target.value)}
                                    className={`form-input ${formErrors.meal_type ? "input-error" : ""}`}
                                >
                                    <option value="">Select meal type</option>
                                    {mealTypes.map(m => (
                                        <option key={m} value={m}>
                                            {m.charAt(0).toUpperCase() + m.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField
                                label="Recipe"
                                error={formErrors.recipe_id}
                                required
                            >
                                <select
                                    value={form.recipe_id}
                                    onChange={e => handleFormChange("recipe_id", e.target.value)}
                                    className={`form-input ${formErrors.recipe_id ? "input-error" : ""}`}
                                >
                                    <option value="">Select recipe</option>
                                    {recipes.map(r => (
                                        <option key={r._id} value={r._id}>
                                            {r.title}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Status">
                                <select
                                    value={form.status}
                                    onChange={e => handleFormChange("status", e.target.value)}
                                    className="form-input"
                                >
                                    {statusOptions.map(s => (
                                        <option key={s} value={s}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        </div>

                        {/* Submit Error */}
                        {formErrors.duplicate && (
                            <div className="alert alert-warning">
                                ⚠️ {formErrors.duplicate}
                            </div>
                        )}
                        {formErrors.submit && (
                            <div className="alert alert-error">
                                ❌ {formErrors.submit}
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!isFormValid()}
                            >
                                {editingId ? "✏️ Update Meal" : "+ Create Meal"}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Search & Filter Card */}
                <section className="search-filter-card">
                    <div className="search-filter-content">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by recipe name..."
                                value={searchRecipe}
                                onChange={e => setSearchRecipe(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <select
                            value={filterMealType}
                            onChange={e => setFilterMealType(e.target.value)}
                            className="form-input"
                        >
                            <option value="">All Meals</option>
                            {mealTypes.map(m => (
                                <option key={m} value={m}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="form-input"
                        >
                            <option value="">All Status</option>
                            {statusOptions.map(s => (
                                <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>

                        {(searchRecipe || filterMealType || filterStatus) && (
                            <button
                                onClick={resetFilters}
                                className="btn btn-ghost"
                                title="Reset filters"
                            >
                                ✕ Reset
                            </button>
                        )}
                    </div>
                </section>

                {/* Meals Table Card */}
                <section className="meals-table-card">
                    {filteredMeals.length === 0 && !isLoading ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p className="empty-title">No meals planned yet</p>
                            <p className="empty-message">Start by creating your first meal plan above</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="meals-table">
                                <thead>
                                    <tr>
                                        <th>📅 Date</th>
                                        <th>🍽️ Meal Type</th>
                                        <th>🥘 Recipe</th>
                                        <th>Status</th>
                                        <th>Alerts</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <>
                                            <MealRowSkeleton />
                                            <MealRowSkeleton />
                                            <MealRowSkeleton />
                                        </>
                                    ) : (
                                        filteredMeals.map((m, idx) => (
                                            <tr key={m._id} className={`meal-row ${idx % 2 === 0 ? "" : "alt"}`}>
                                                <td className="date-cell">
                                                    <strong>{m.meal_date}</strong>
                                                </td>
                                                <td className="meal-type-cell">
                                                    {m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)}
                                                </td>
                                                <td className="recipe-cell">
                                                    {m.recipe_title || getRecipeName(m.recipe_id)}
                                                </td>
                                                <td className="status-cell">
                                                    <StatusBadge status={m.status || "planned"} />
                                                </td>
                                                <td className="alerts-cell">
                                                    {m.warnings && m.warnings.length > 0 ? (
                                                        <Tooltip text={m.warnings.join("\n")}>
                                                            <span className={`alert-badge alert-badge-${m.warnings.length > 1 ? 'critical' : 'warning'}`}>
                                                                {m.warnings.length} Issue{m.warnings.length > 1 ? 's' : ''}
                                                            </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="alert-badge alert-badge-ok">✓ OK</span>
                                                    )}
                                                </td>
                                                <td className="actions-cell">
                                                    <Tooltip text="View recipe">
                                                        <button
                                                            className="action-btn view-btn"
                                                            onClick={() => viewRecipeDetails(m.recipe_id)}
                                                        >
                                                            👁️
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip text="Edit meal">
                                                        <button
                                                            className="action-btn edit-btn"
                                                            onClick={() => handleEdit(m)}
                                                        >
                                                            ✏️
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip text="Delete meal">
                                                        <button
                                                            className="action-btn delete-btn"
                                                            onClick={() => handleDeleteClick(m._id)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {filteredMeals.length > 0 && (
                        <div className="table-footer">
                            <p className="result-count">
                                Showing {filteredMeals.length} of {meals.length} meals
                            </p>
                        </div>
                    )}
                </section>

                {/* Recipe Details Modal */}
                {selectedRecipe && (
                    <section className="recipe-modal-overlay">
                        <div className="recipe-modal">
                            <button
                                className="modal-close-btn"
                                onClick={() => setSelectedRecipe(null)}
                            >
                                ✕
                            </button>

                            <div className="recipe-header">
                                <h2 className="recipe-title">📖 {selectedRecipe.title}</h2>
                                {selectedRecipe.description && (
                                    <p className="recipe-description">{selectedRecipe.description}</p>
                                )}
                            </div>

                            <div className="recipe-info-grid">
                                <div className="info-card">
                                    <div className="info-label">Category</div>
                                    <div className="info-value">{selectedRecipe.category}</div>
                                </div>
                                <div className="info-card">
                                    <div className="info-label">Cook Time</div>
                                    <div className="info-value">
                                        {selectedRecipe.estimated_cooking_time ? `${selectedRecipe.estimated_cooking_time} min` : "N/A"}
                                    </div>
                                </div>
                                <div className="info-card">
                                    <div className="info-label">Dietary Tags</div>
                                    <div className="info-value">
                                        {selectedRecipe.dietary_tags?.length > 0
                                            ? selectedRecipe.dietary_tags.join(", ")
                                            : "None"}
                                    </div>
                                </div>
                            </div>

                            <div className="recipe-section">
                                <h3 className="section-subtitle">🥘 Ingredients</h3>
                                <ul className="ingredients-list">
                                    {selectedRecipe.ingredients?.map((ing, idx) => (
                                        <li key={idx} className="ingredient-item">
                                            <span className="ingredient-name">{ing.name}</span>
                                            <span className="ingredient-amount">
                                                {ing.quantity} {ing.unit}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="recipe-section">
                                <h3 className="section-subtitle">👨‍🍳 Preparation Steps</h3>
                                <ol className="steps-list">
                                    {selectedRecipe.preparation_steps?.map((step, idx) => (
                                        <li key={idx} className="step-item">{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}