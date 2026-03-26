import { useEffect, useState, useCallback } from "react";
import { getMeals, createMeal, updateMeal, deleteMeal } from "../services/mealService";
import { getRecipes } from "../api/recipes";
import api from "../api/axios";
import "../styles/MealSchedule.css";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
    return (
        <div className="ms-toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`ms-toast ms-toast-${t.type}`}>
                    <span>{t.message}</span>
                    <button onClick={() => remove(t.id)}>×</button>
                </div>
            ))}
        </div>
    );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="ms-overlay" onClick={onCancel}>
            <div className="ms-modal" onClick={e => e.stopPropagation()}>
                <p>{message}</p>
                <div className="ms-modal-actions">
                    <button className="ms-btn ms-btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="ms-btn ms-btn-danger" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="ms-skeleton-row">
            {[...Array(7)].map((_, i) => (
                <td key={i}><div className="ms-skeleton" /></td>
            ))}
        </tr>
    );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ text, children }) {
    const [show, setShow] = useState(false);
    return (
        <span className="ms-tooltip-wrap"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}>
            {children}
            {show && <div className="ms-tooltip">{text}</div>}
        </span>
    );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        planned:   { color: "#f59e0b", label: "Planned" },
        done:      { color: "#10b981", label: "Done" },
        skipped:   { color: "#ef4444", label: "Skipped" },
        cancelled: { color: "#6b7280", label: "Cancelled" },
    };
    const s = map[status] || map.planned;
    return <span className="ms-badge" style={{ background: s.color }}>{s.label}</span>;
}

// ── Calendar Day View ────────────────────────────────────────────────────────
function CalendarView({ meals, allRecipes, onEdit, onDelete, onAdd }) {
    const [selectedDate, setSelectedDate] = useState("");

    const mealsOnDate = selectedDate
        ? meals.filter(m => m.meal_date === selectedDate)
        : [];

    const getRecipe = id => allRecipes.find(r => r._id === id);

    const slotInfo = MEAL_TYPES.map(type => {
        const meal = mealsOnDate.find(m => m.meal_type === type);
        return { type, meal };
    });

    const icons = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

    return (
        <div className="ms-card">
            <h2>📆 Calendar View</h2>
            <div className="ms-cal-picker">
                <label>Select a date to view meals:</label>
                <input
                    type="date"
                    className="ms-input"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                />
                {selectedDate && (
                    <button className="ms-btn ms-btn-ghost" onClick={() => setSelectedDate("")}>
                        ✕ Clear
                    </button>
                )}
            </div>

            {selectedDate && (
                <div className="ms-cal-slots">
                    {slotInfo.map(({ type, meal }) => (
                        <div key={type} className={`ms-cal-slot ms-cal-slot-${type} ${meal ? "ms-cal-slot-filled" : "ms-cal-slot-empty"}`}>
                            <div className="ms-cal-slot-header">
                                <span className="ms-cal-slot-icon">{icons[type]}</span>
                                <span className="ms-cal-slot-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                {meal && <StatusBadge status={meal.status || "planned"} />}
                            </div>

                            {meal ? (
                                <div className="ms-cal-slot-body">
                                    <p className="ms-cal-recipe-name">
                                        {meal.recipe_title || getRecipe(meal.recipe_id)?.title || "Unknown Recipe"}
                                    </p>
                                    {meal.description && (
                                        <p className="ms-cal-desc">{meal.description}</p>
                                    )}
                                    {meal.warnings?.length > 0 && (
                                        <p className="ms-cal-warn">⚠️ {meal.warnings.length} inventory issue{meal.warnings.length > 1 ? "s" : ""}</p>
                                    )}
                                    <div className="ms-cal-actions">
                                        <button className="ms-btn ms-btn-sm ms-btn-edit" onClick={() => onEdit(meal)}>✏️ Edit</button>
                                        <button className="ms-btn ms-btn-sm ms-btn-danger" onClick={() => onDelete(meal._id)}>🗑️</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="ms-cal-slot-body ms-cal-empty-body">
                                    <p className="ms-cal-no-meal">No {type} planned</p>
                                    <button
                                        className="ms-btn ms-btn-sm ms-btn-primary"
                                        onClick={() => onAdd(selectedDate, type)}
                                    >
                                        + Add {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!selectedDate && (
                <p className="ms-cal-hint">👆 Pick a date above to see what's planned for that day.</p>
            )}
        </div>
    );
}

const MEAL_TYPES  = ["breakfast", "lunch", "dinner", "snack"];
const STATUS_OPTS = ["planned", "done", "skipped", "cancelled"];
const EMPTY_FORM  = {
    meal_date: "", meal_type: "", recipe_id: "",
    status: "planned", description: ""
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MealSchedulePage() {
    const [meals,        setMeals]        = useState([]);
    const [allRecipes,   setAllRecipes]   = useState([]);
    const [typeRecipes,  setTypeRecipes]  = useState([]);
    const [form,         setForm]         = useState(EMPTY_FORM);
    const [errors,       setErrors]       = useState({});
    const [editingId,    setEditingId]    = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [deleteId,     setDeleteId]     = useState(null);
    const [toasts,       setToasts]       = useState([]);
    const [search,       setSearch]       = useState("");
    const [filterType,   setFilterType]   = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [expandedId,   setExpandedId]   = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);

    // ── Toast helpers ─────────────────────────────────────────────────────────
    const toast = useCallback((message, type = "info") => {
        const id = Date.now();
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    }, []);

    const removeToast = id => setToasts(p => p.filter(t => t.id !== id));

    // ── Load meals + all recipes ──────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [mRes, rRes] = await Promise.all([
                getMeals(),
                getRecipes({ limit: 200 })
            ]);
            setMeals(Array.isArray(mRes.data) ? mRes.data : []);
            setAllRecipes(Array.isArray(rRes.data) ? rRes.data : []);
        } catch (err) {
            console.error("Load error:", err?.response?.status, err?.response?.data || err?.message);
            // Try loading each separately so one failure doesn't block the other
            try {
                const mRes = await getMeals();
                setMeals(Array.isArray(mRes.data) ? mRes.data : []);
            } catch (e) {
                console.error("Meals load failed:", e?.response?.data || e?.message);
                setMeals([]);
            }
            try {
                const rRes = await getRecipes({ limit: 200 });
                setAllRecipes(Array.isArray(rRes.data) ? rRes.data : []);
            } catch (e) {
                console.error("Recipes load failed:", e?.response?.data || e?.message);
                setAllRecipes([]);
            }
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    // ── When meal_type changes, fetch matching recipes ────────────────────────
    useEffect(() => {
        if (!form.meal_type) {
            setTypeRecipes([]);
            setForm(p => ({ ...p, recipe_id: "" }));
            return;
        }
        api.get(`/api/recipes/by-type/${form.meal_type}`)
            .then(res => {
                const recipes = res.data || [];
                setTypeRecipes(recipes);
                // reset recipe_id if current selection not in new list
                if (!recipes.find(r => r._id === form.recipe_id)) {
                    setForm(p => ({ ...p, recipe_id: "" }));
                }
            })
            .catch(() => {
                // fallback: filter from allRecipes client-side
                setTypeRecipes(allRecipes.filter(r => r.category === form.meal_type));
            });
    }, [form.meal_type]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.meal_date) e.meal_date = "Date is required";
        if (!form.meal_type) e.meal_type = "Meal type is required";
        if (!form.recipe_id) e.recipe_id = "Recipe is required";
        const dup = meals.some(m =>
            m.meal_date === form.meal_date &&
            m.meal_type === form.meal_type &&
            m._id !== editingId
        );
        if (dup) e.duplicate = `A ${form.meal_type} is already planned for ${form.meal_date}`;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async e => {
        e.preventDefault();
        if (!validate()) { toast("Please fix the errors below", "warning"); return; }
        try {
            const payload = {
                user_id: "1",
                recipe_id: form.recipe_id,
                meal_date: form.meal_date,
                meal_type: form.meal_type,
                status: form.status,
                description: form.description || null,
            };
            if (editingId) {
                await updateMeal(editingId, payload);
                toast("Meal updated ✨", "success");
            } else {
                await createMeal(payload);
                toast("Meal created 🎉", "success");
            }
            setForm(EMPTY_FORM);
            setErrors({});
            setEditingId(null);
            setTypeRecipes([]);
            load();
        } catch (err) {
            const msg = err?.response?.data?.detail || "Operation failed";
            toast(typeof msg === "string" ? msg : JSON.stringify(msg), "error");
        }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────
    const handleEdit = meal => {
        setEditingId(meal._id);
        setForm({
            meal_date:   meal.meal_date,
            meal_type:   meal.meal_type,
            recipe_id:   meal.recipe_id,
            status:      meal.status || "planned",
            description: meal.description || "",
        });
        setErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        try {
            await deleteMeal(deleteId);
            toast("Meal deleted", "success");
            setDeleteId(null);
            load();
        } catch {
            toast("Failed to delete meal", "error");
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setTypeRecipes([]);
    };

    // ── Pre-fill form from calendar slot ──────────────────────────────────────────
    const handleAddFromCalendar = (date, type) => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, meal_date: date, meal_type: type });
        setErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── Filtered meals ────────────────────────────────────────────────────────
    const filtered = meals.filter(m => {
        const name = (m.recipe_title || allRecipes.find(r => r._id === m.recipe_id)?.title || "").toLowerCase();
        return (
            (!search       || name.includes(search.toLowerCase())) &&
            (!filterType   || m.meal_type === filterType) &&
            (!filterStatus || m.status    === filterStatus)
        );
    });

    const getRecipe = id => allRecipes.find(r => r._id === id);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="ms-page">
            <Toast toasts={toasts} remove={removeToast} />
            {deleteId && (
                <ConfirmModal
                    message="Are you sure you want to delete this meal? This cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                />
            )}

            {/* Header */}
            <div className="ms-header">
                <h1>📅 Meal Schedule</h1>
                <p>Plan and manage your daily meals</p>
            </div>

            {/* Form */}
            <div className="ms-card">
                <h2>{editingId ? "✏️ Edit Meal" : "➕ New Meal"}</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="ms-form-grid">

                        {/* Date */}
                        <div className="ms-field">
                            <label>Date <span className="ms-req">*</span></label>
                            <input type="date"
                                className={errors.meal_date ? "ms-input ms-input-err" : "ms-input"}
                                value={form.meal_date}
                                onChange={e => setForm(p => ({ ...p, meal_date: e.target.value }))}
                            />
                            {errors.meal_date && <span className="ms-err">{errors.meal_date}</span>}
                        </div>

                        {/* Meal Type */}
                        <div className="ms-field">
                            <label>Meal Type <span className="ms-req">*</span></label>
                            <select
                                className={errors.meal_type ? "ms-input ms-input-err" : "ms-input"}
                                value={form.meal_type}
                                onChange={e => setForm(p => ({ ...p, meal_type: e.target.value }))}
                            >
                                <option value="">Select type</option>
                                {MEAL_TYPES.map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                            {errors.meal_type && <span className="ms-err">{errors.meal_type}</span>}
                        </div>

                        {/* Recipe — filtered by meal type */}
                        <div className="ms-field">
                            <label>Recipe <span className="ms-req">*</span></label>
                            <select
                                className={errors.recipe_id ? "ms-input ms-input-err" : "ms-input"}
                                value={form.recipe_id}
                                onChange={e => setForm(p => ({ ...p, recipe_id: e.target.value }))}
                                disabled={!form.meal_type}
                            >
                                <option value="">
                                    {form.meal_type
                                        ? typeRecipes.length === 0
                                            ? `No ${form.meal_type} recipes found`
                                            : "Select recipe"
                                        : "Select meal type first"}
                                </option>
                                {typeRecipes.map(r => (
                                    <option key={r._id} value={r._id}>{r.title}</option>
                                ))}
                            </select>
                            {errors.recipe_id && <span className="ms-err">{errors.recipe_id}</span>}
                            {form.meal_type && typeRecipes.length === 0 && (
                                <span className="ms-hint">No recipes with category "{form.meal_type}" found. Add recipes first.</span>
                            )}
                        </div>

                        {/* Status */}
                        <div className="ms-field">
                            <label>Status</label>
                            <select className="ms-input" value={form.status}
                                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                {STATUS_OPTS.map(s => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description — full width */}
                    <div className="ms-field ms-field-full">
                        <label>Description <span className="ms-optional">(optional)</span></label>
                        <textarea
                            className="ms-input ms-textarea"
                            placeholder="Add notes about this meal plan..."
                            value={form.description}
                            maxLength={500}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        />
                        <span className="ms-char-count">{form.description.length}/500</span>
                    </div>

                    {errors.duplicate && (
                        <div className="ms-alert ms-alert-warning">⚠️ {errors.duplicate}</div>
                    )}

                    <div className="ms-form-actions">
                        <button type="submit" className="ms-btn ms-btn-primary">
                            {editingId ? "Update Meal" : "Create Meal"}
                        </button>
                        {editingId && (
                            <button type="button" className="ms-btn ms-btn-secondary" onClick={handleCancel}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Filters */}
            <div className="ms-card ms-filters">
                <input className="ms-input" placeholder="🔍 Search by recipe..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                <select className="ms-input" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">All Meal Types</option>
                    {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <select className="ms-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                {(search || filterType || filterStatus) && (
                    <button className="ms-btn ms-btn-ghost"
                        onClick={() => { setSearch(""); setFilterType(""); setFilterStatus(""); }}>
                        ✕ Reset
                    </button>
                )}
                <button
                    className={`ms-btn ${showCalendar ? "ms-btn-primary" : "ms-btn-ghost"}`}
                    onClick={() => setShowCalendar(p => !p)}
                >
                    📆 Calendar View
                </button>
            </div>

            {/* Calendar View — toggled */}
            {showCalendar && (
                <CalendarView
                    meals={meals}
                    allRecipes={allRecipes}
                    onEdit={handleEdit}
                    onDelete={setDeleteId}
                    onAdd={handleAddFromCalendar}
                />
            )}

            {/* Table */}
            <div className="ms-card ms-table-card">
                {filtered.length === 0 && !loading ? (
                    <div className="ms-empty">
                        <div style={{ fontSize: "3rem" }}>📭</div>
                        <p>No meals found. Create your first meal above!</p>
                    </div>
                ) : (
                    <div className="ms-table-wrap">
                        <table className="ms-table">
                            <thead>
                                <tr>
                                    <th>📅 Date</th>
                                    <th>🍽️ Type</th>
                                    <th>🥘 Recipe</th>
                                    <th>📝 Description</th>
                                    <th>Status</th>
                                    <th>⚠️ Alerts</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    filtered.map(m => {
                                        const recipe = getRecipe(m.recipe_id);
                                        const isOpen = expandedId === m._id;
                                        return (
                                            <>
                                                <tr key={m._id} className="ms-row">
                                                    <td><strong>{m.meal_date}</strong></td>
                                                    <td>
                                                        <span className={`ms-type-chip ms-type-${m.meal_type}`}>
                                                            {m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="ms-link"
                                                            onClick={() => setExpandedId(isOpen ? null : m._id)}>
                                                            {m.recipe_title || recipe?.title || m.recipe_id}
                                                            <span style={{ marginLeft: 4 }}>{isOpen ? "▲" : "▼"}</span>
                                                        </button>
                                                    </td>
                                                    <td className="ms-desc-cell">
                                                        {m.description
                                                            ? <Tooltip text={m.description}>
                                                                <span className="ms-desc-preview">{m.description.slice(0, 40)}{m.description.length > 40 ? "…" : ""}</span>
                                                              </Tooltip>
                                                            : <span className="ms-muted">—</span>}
                                                    </td>
                                                    <td><StatusBadge status={m.status || "planned"} /></td>
                                                    <td>
                                                        {m.warnings?.length > 0 ? (
                                                            <Tooltip text={m.warnings.join(" | ")}>
                                                                <span className="ms-warn-badge">
                                                                    ⚠️ {m.warnings.length} issue{m.warnings.length > 1 ? "s" : ""}
                                                                </span>
                                                            </Tooltip>
                                                        ) : (
                                                            <span className="ms-ok-badge">✓ OK</span>
                                                        )}
                                                    </td>
                                                    <td className="ms-actions">
                                                        <button className="ms-btn ms-btn-sm ms-btn-edit"
                                                            onClick={() => handleEdit(m)}>✏️ Edit</button>
                                                        <button className="ms-btn ms-btn-sm ms-btn-danger"
                                                            onClick={() => setDeleteId(m._id)}>🗑️</button>
                                                    </td>
                                                </tr>

                                                {isOpen && (
                                                    <tr key={`${m._id}-detail`} className="ms-detail-row">
                                                        <td colSpan={7}>
                                                            <div className="ms-detail">
                                                                {recipe ? (
                                                                    <>
                                                                        {recipe.description && <p className="ms-recipe-desc"><em>{recipe.description}</em></p>}
                                                                        <div className="ms-detail-grid">
                                                                            <div><strong>Category:</strong> {recipe.category}</div>
                                                                            <div><strong>Cook Time:</strong> {recipe.estimated_cooking_time ? `${recipe.estimated_cooking_time} min` : "N/A"}</div>
                                                                            <div><strong>Tags:</strong> {recipe.dietary_tags?.join(", ") || "None"}</div>
                                                                            {m.total_calories_estimate && (
                                                                                <div><strong>Est. Calories:</strong> {m.total_calories_estimate} kcal</div>
                                                                            )}
                                                                        </div>

                                                                        <div className="ms-detail-sections">
                                                                            {/* Ingredients */}
                                                                            <div className="ms-detail-section">
                                                                                <h4 className="ms-section-title">🥘 Ingredients</h4>
                                                                                {recipe.ingredients?.length > 0 ? (
                                                                                    <ul className="ms-ing-list">
                                                                                        {recipe.ingredients.map((ing, i) => (
                                                                                            <li key={i}>
                                                                                                <span className="ms-ing-qty">{ing.quantity} {ing.unit}</span>
                                                                                                <span className="ms-ing-name">{ing.name}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                ) : <p className="ms-muted">No ingredients listed.</p>}
                                                                            </div>

                                                                            {/* Preparation Steps */}
                                                                            <div className="ms-detail-section">
                                                                                <h4 className="ms-section-title">👨‍🍳 Preparation Steps</h4>
                                                                                {recipe.preparation_steps?.length > 0 ? (
                                                                                    <ol className="ms-steps-list">
                                                                                        {recipe.preparation_steps.map((step, i) => (
                                                                                            <li key={i} className="ms-step-item">{step}</li>
                                                                                        ))}
                                                                                    </ol>
                                                                                ) : <p className="ms-muted">No preparation steps listed.</p>}
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <p>Recipe details not available.</p>
                                                                )}
                                                                {m.warnings?.length > 0 && (
                                                                    <div className="ms-warn-list">
                                                                        <strong>⚠️ Inventory Warnings:</strong>
                                                                        <ul>{m.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {filtered.length > 0 && (
                    <div className="ms-table-footer">
                        Showing {filtered.length} of {meals.length} meals
                    </div>
                )}
            </div>
        </div>
    );
}
