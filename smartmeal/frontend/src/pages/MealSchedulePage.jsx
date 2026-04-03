import React, { useEffect, useState, useCallback } from "react";
import { getMeals, createMeal, updateMeal, deleteMeal, getMealIngredients } from "../services/mealService";
import { getRecipes } from "../api/recipes";
import ShoppingAPI from "../services/shoppingApi";
import api from "../api/axios";
import "../styles/MealSchedule.css";

const MEAL_TYPES  = ["breakfast", "lunch", "dinner", "snack"];
const STATUS_OPTS = ["planned", "done", "skipped", "cancelled"];
const EMPTY_FORM  = { meal_date: "", meal_type: "", recipe_id: "", status: "planned", description: "" };
const ICONS = { breakfast: "🌅", lunch: "🍽️", dinner: "🌙", snack: "🎉" };


// ── Toast ────────────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
    return (
        <div className="ms-toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`ms-toast ms-toast-${t.type}`}>
                    <span>{t.message}</span>
                    <button onClick={() => remove(t.id)}></button>
                </div>
            ))}
        </div>
    );
}

// ── Confirm Modal ────────────────────────────────────────────────────────────────────────
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

// ✓✓ Skeleton Row ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
function SkeletonRow() {
    return (
        <tr className="ms-skeleton-row">
            {[...Array(7)].map((_, i) => (
                <td key={i}><div className="ms-skeleton" /></td>
            ))}
        </tr>
    );
}

// ✓✓ Tooltip ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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

// ✓✓ Status Badge ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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
// ✓✓ 📖 Recipe Details Modal ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
function RecipeDetailsModal({ meal, recipe, onClose, ingredients, addedIng }) {
    if (!recipe) {
        return (
            <div className="ms-overlay" onClick={onClose}>
                <div className="ms-modal ms-modal-large" onClick={e => e.stopPropagation()}>
                    <div className="ms-modal-header">
                        <h3>📖 Recipe Details</h3>
                        <button className="ms-modal-close" onClick={onClose}></button>
                    </div>
                    <div className="ms-modal-body">
                        <p>Recipe details not available.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ms-overlay" onClick={onClose}>
            <div className="ms-modal ms-modal-large" onClick={e => e.stopPropagation()}>
                <div className="ms-modal-header">
                    <h3>📖 {recipe.title}</h3>
                    <button className="ms-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="ms-modal-body">
                    {recipe.description && <p className="ms-recipe-desc"><em>{recipe.description}</em></p>}
                    
                    <div className="ms-detail-grid">
                        <div><strong>Category:</strong> {recipe.category}</div>
                        <div><strong>Cook Time:</strong> {recipe.estimated_cooking_time ? `${recipe.estimated_cooking_time} min` : "N/A"}</div>
                        <div><strong>Tags:</strong> {recipe.dietary_tags?.join(", ") || "None"}</div>
                        {meal.total_calories_estimate && (
                            <div><strong>Est. Calories:</strong> {meal.total_calories_estimate} kcal</div>
                        )}
                    </div>

                    <div className="ms-detail-sections">
                        {/* 🥘 Ingredients */}
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

                        {/* 👨‍🍳 Preparation Steps */}
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

                    {(() => {
                        const ings = ingredients?.[meal._id];
                        const activeWarnings = meal.warnings?.filter(w => {
                            if (!ings) return true;
                            // hide warning if the ingredient was added to shopping list
                            return !ings.some(ing =>
                                w.toLowerCase().includes(ing.name.toLowerCase()) &&
                                (ing.addedToList || addedIng?.[`${meal._id}_${ing.name}`])
                            );
                        });
                        return activeWarnings?.length > 0 ? (
                            <div className="ms-warn-list">
                                <strong>⚠️ Inventory Warnings:</strong>
                                <ul>{activeWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                            </div>
                        ) : null;
                    })()}
                </div>
            </div>
        </div>
    );
}
// ✓✓ Meal Alert Badge ✓ shared helper ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
function MealAlertBadge({ meal, ingredients }) {
    const ings = ingredients[meal._id];
    const unresolved = ings ? ings.filter(i => i.missing && !i.addedToList).length : (meal.warnings?.length || 0);
    if (unresolved > 0) return <span className="ms-cal-warn">⚠️ {unresolved} missing</span>;
    if (ings) return <span className="ms-cal-ok">✅ OK</span>;
    return null;
}

// ✓✓ Ingredient Popover ✓ shared inline ingredient list ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
function IngredientPopover({ meal, ingredients, addingIng, addedIng, onAddToShopping }) {
    const ings = ingredients[meal._id];
    if (!ings || ings.length === 0) return null;
    return (
        <div className="ms-ing-popover">
            <p className="ms-ing-popover-title"> 🥘 Ingredients</p>
            {ings.map(ing => {
                const key = `${ing.meal_id}_${ing.name}`;
                const isAdded = ing.addedToList || addedIng[key];
                const isMissing = ing.missing && !isAdded;
                return (
                    <div key={key} className={`ms-ing-pop-row ${isMissing ? "ms-ing-pop-missing" : isAdded ? "ms-ing-pop-added" : "ms-ing-pop-ok"}`}>
                        <span className="ms-ing-pop-name">{ing.name}</span>
                        {isMissing && (
                            <button
                                className="ms-btn ms-btn-sm ms-btn-shopping"
                                disabled={addingIng[key]}
                                onClick={() => onAddToShopping(ing)}
                            >
                                {addingIng[key] ? "⏳" : "➕ Add"}
                            </button>
                        )}
                        {isAdded && <span className="ms-ing-badge ms-ing-badge-added">✅ Added</span>}
                        {!isMissing && !isAdded && <span className="ms-ing-badge ms-ing-badge-ok">✅</span>}
                    </div>
                );
            })}
        </div>
    );
}

// ✓✓ 📅 Daily View ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
function DailyView({ meals, allRecipes, onEdit, onDelete, onAdd, onViewRecipe, ingredients, addingIng, addedIng, onAddToShopping }) {
    const today = new Date().toISOString().slice(0, 10);
    const [date, setDate] = useState(today);
    const dayMeals = meals.filter(m => m.meal_date === date);
    const getRecipe = id => allRecipes.find(r => r._id === id);

    return (
        <div className="ms-card">
            <div className="ms-view-header">
                <h2>📅 Daily View</h2>
                <input type="date" className="ms-input" style={{ maxWidth: 180 }}
                    value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="ms-cal-slots">
                {MEAL_TYPES.map(type => {
                    const meal = dayMeals.find(m => m.meal_type === type);
                    return (
                        <div key={type} className={`ms-cal-slot ms-cal-slot-${type} ${meal ? "ms-cal-slot-filled" : "ms-cal-slot-empty"}`}>
                            <div className="ms-cal-slot-header">
                                <span className="ms-cal-slot-icon">{ICONS[type]}</span>
                                <span className="ms-cal-slot-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                {meal && <StatusBadge status={meal.status || "planned"} />}
                            </div>
                            <div className="ms-cal-slot-body">
                                {meal ? (
                                    <>
                                        <p className="ms-cal-recipe-name">{meal.recipe_title || getRecipe(meal.recipe_id)?.title || "Unknown"}</p>
                                        {meal.description && <p className="ms-cal-desc">{meal.description}</p>}
                                        <MealAlertBadge meal={meal} ingredients={ingredients} />
                                        <IngredientPopover meal={meal} ingredients={ingredients} addingIng={addingIng} addedIng={addedIng} onAddToShopping={onAddToShopping} />
                                        <div className="ms-cal-actions">
                                            {(() => {
                                                const missingIngs = (ingredients[meal._id] || []).filter(i => i.missing && !i.addedToList);
                                                return missingIngs.length > 0 ? (
                                                    <button
                                                        className="ms-btn ms-btn-sm ms-btn-shopping"
                                                        disabled={missingIngs.some(i => addingIng[`${i.meal_id}_${i.name}`])}
                                                        onClick={() => missingIngs.forEach(i => onAddToShopping(i))}
                                                    >
                                                        ✓ Add to Shopping List
                                                    </button>
                                                ) : null;
                                            })()}
                                            <button className="ms-btn ms-btn-sm ms-btn-info" onClick={() => onViewRecipe(meal)}>👁️ View</button>
                                            <button className="ms-btn ms-btn-sm ms-btn-edit" onClick={() => onEdit(meal)}>✏️ Edit</button>
                                            <button className="ms-btn ms-btn-sm ms-btn-danger" onClick={() => onDelete(meal._id)}>🗑️</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="ms-cal-empty-body">
                                        <p className="ms-cal-no-meal">No {type} planned</p>
                                        <button className="ms-btn ms-btn-sm ms-btn-primary" onClick={() => onAdd(date, type)}>
                                            + Add {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ✓✓ 📋 Weekly View ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
function WeeklyView({ meals, allRecipes, onEdit, onDelete, onAdd, onViewRecipe, ingredients, addingIng, addedIng, onAddToShopping }) {
    const getMonday = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        return date;
    };
    const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
    const getRecipe = id => allRecipes.find(r => r._id === id);
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart); d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
    });
    const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(getMonday(d)); };
    const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(getMonday(d)); };
    const fmt = ds => new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="ms-card">
            <div className="ms-view-header">
                <h2>📋 Weekly View</h2>
                <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                    <button className="ms-btn ms-btn-ghost ms-btn-sm" onClick={prevWeek}>◀ Prev</button>
                    <span style={{ fontSize: ".88rem", fontWeight: 600, color: "#374151" }}>
                        {fmt(days[0])} — {fmt(days[6])}
                    </span>
                    <button className="ms-btn ms-btn-ghost ms-btn-sm" onClick={nextWeek}>Next ▶</button>
                </div>
            </div>
            <div className="ms-week-grid">
                {days.map(day => {
                    const dayMeals = meals.filter(m => m.meal_date === day);
                    const isToday = day === today;
                    return (
                        <div key={day} className={`ms-week-day ${isToday ? "ms-week-today" : ""}`}>
                            <div className="ms-week-day-header">
                                <span className="ms-week-day-name">{new Date(day).toLocaleDateString("en-US", { weekday: "long" })}</span>
                                <span className="ms-week-day-date">{fmt(day)}</span>
                            </div>
                            <div className="ms-week-day-body">
                                {MEAL_TYPES.map(type => {
                                    const meal = dayMeals.find(m => m.meal_type === type);
                                    const missingIngs = meal ? (ingredients[meal._id] || []).filter(i => i.missing && !i.addedToList) : [];
                                    return meal ? (
                                        <div key={type} className={`ms-week-meal-card ms-week-meal-card-${type}`}>
                                            <div className="ms-week-meal-top">
                                                <span className="ms-week-meal-icon">{ICONS[type]}</span>
                                                <span className="ms-week-meal-type">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                                <MealAlertBadge meal={meal} ingredients={ingredients} />
                                            </div>
                                            <p className="ms-week-meal-title">{meal.recipe_title || getRecipe(meal.recipe_id)?.title || "Unknown"}</p>
                                            <div className="ms-week-meal-btns">
                                                {missingIngs.length > 0 && (
                                                    <button
                                                        className="ms-week-action-btn ms-week-action-shop"
                                                        disabled={missingIngs.some(i => addingIng[`${i.meal_id}_${i.name}`])}
                                                        onClick={() => missingIngs.forEach(i => onAddToShopping(i))}
                                                        title="Add missing to Shopping List"
                                                    >🛒 Shopping</button>
                                                )}
                                                <button className="ms-week-action-btn ms-week-action-view" onClick={() => onViewRecipe(meal)} title="View Recipe">👁️ View</button>
                                                <button className="ms-week-action-btn ms-week-action-edit" onClick={() => onEdit(meal)} title="Edit">✏️ Edit</button>
                                                <button className="ms-week-action-btn ms-week-action-delete" onClick={() => onDelete(meal._id)} title="Delete">🗑️ Delete</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={type} className="ms-week-empty-slot" onClick={() => onAdd(day, type)}>
                                            <span>{ICONS[type]}</span>
                                            <span className="ms-week-empty-label">+ {type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
// ✓✓ 📆 Monthly View ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
function MonthlyView({ meals, allRecipes, onEdit, onDelete, onAdd, onViewRecipe, ingredients, addingIng, addedIng, onAddToShopping }) {
    const now = new Date();
    const [year, setYear]   = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const getRecipe = id => allRecipes.find(r => r._id === id);

    const monthNames  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    // Generate 4-day groups for better alignment
    const getFirstDayOfMonth = () => {
        const date = new Date(year, month, 1);
        const day = date.getDay();
        return day === 0 ? 6 : day - 1; // Convert to Monday=0
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOffset = getFirstDayOfMonth();
    const dayGroups = [];
    let group = [];

    // Add empty days for days before the 1st of the month
    for (let i = 0; i < firstDayOffset; i++) {
        group.push(null);
    }

    // Add all days of the month
    for (let d = 1; d <= daysInMonth; d++) {
        group.push(d);
        if (group.length === 4) {
            dayGroups.push(group);
            group = [];
        }
    }

    // Add empty days for remaining slots
    while (group.length < 4 && group.length > 0) {
        group.push(null);
    }
    if (group.length > 0) {
        dayGroups.push(group);
    }

    const fmt = ds => new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="ms-card">
            <div className="ms-view-header">
                <h2>📆 Monthly View</h2>
                <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                    <button className="ms-btn ms-btn-ghost ms-btn-sm" onClick={prevMonth}>◀ Prev</button>
                    <span style={{ fontWeight: 600, minWidth: 130, textAlign: "center" }}>{monthNames[month]} {year}</span>
                    <button className="ms-btn ms-btn-ghost ms-btn-sm" onClick={nextMonth}>Next ▶</button>
                </div>
            </div>
            
            {dayGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="ms-month-grid" style={{marginBottom: '1.25rem'}}>
                    {group.map((day, dayIdx) => {
                        if (!day) return <div key={`e${groupIdx}-${dayIdx}`} className="ms-month-cell ms-month-empty" />;
                        
                        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const dayMeals = meals.filter(m => m.meal_date === dateStr);
                        const isToday = dateStr === today;
                        const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });

                        return (
                            <div key={day} className={`ms-month-cell ${isToday ? "ms-month-today" : ""}`}>
                                <div className="ms-month-day-header">
                                    <span className="ms-month-day-name">{dayName}</span>
                                    <span className="ms-month-day-date">{fmt(dateStr)}</span>
                                </div>
                                <div className="ms-month-day-body">
                                    {MEAL_TYPES.map(type => {
                                        const meal = dayMeals.find(m => m.meal_type === type);
                                        const missingIngs = meal ? (ingredients[meal._id] || []).filter(i => i.missing && !i.addedToList) : [];
                                        return meal ? (
                                            <div key={type} className={`ms-month-meal-card ms-month-meal-card-${type}`}>
                                                <div className="ms-month-meal-top">
                                                    <span className="ms-month-meal-icon">{ICONS[type]}</span>
                                                    <span className="ms-month-meal-type">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                                    <MealAlertBadge meal={meal} ingredients={ingredients} />
                                                </div>
                                                <p className="ms-month-meal-title">{meal.recipe_title || getRecipe(meal.recipe_id)?.title || "Unknown"}</p>
                                                <div className="ms-month-meal-btns">
                                                    {missingIngs.length > 0 && (
                                                        <button
                                                            className="ms-month-action-btn ms-month-action-shop"
                                                            disabled={missingIngs.some(i => addingIng[`${i.meal_id}_${i.name}`])}
                                                            onClick={() => missingIngs.forEach(i => onAddToShopping(i))}
                                                            title="Add missing to Shopping List"
                                                        >🛒</button>
                                                    )}
                                                    <button className="ms-month-action-btn ms-month-action-view" onClick={() => onViewRecipe(meal)} title="View Recipe">👁️</button>
                                                    <button className="ms-month-action-btn ms-month-action-edit" onClick={() => onEdit(meal)} title="Edit">✏️</button>
                                                    <button className="ms-month-action-btn ms-month-action-delete" onClick={() => onDelete(meal._id)} title="Delete">🗑️</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={type} className="ms-month-empty-slot" onClick={() => onAdd(dateStr, type)}>
                                                <span>{ICONS[type]}</span>
                                                <span className="ms-month-empty-label">+ {type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}


// ✓✓ Main Page ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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
    const [viewedMealId, setViewedMealId] = useState(null);
    const [viewMode,     setViewMode]     = useState("list");
    const [ingredients,  setIngredients]  = useState({});   // { mealId: [] }
    const [addingIng,    setAddingIng]    = useState({});   // { mealId_ingName: true }
    const [addedIng,     setAddedIng]     = useState({});   // { mealId_ingName: true }

    // ✓✓ Toast helpers ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
    const toast = useCallback((message, type = "info") => {
        const id = Date.now();
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    }, []);

    const removeToast = id => setToasts(p => p.filter(t => t.id !== id));

    // ✓✓ Load meals + all recipes ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [mRes, rRes, shoppingRes] = await Promise.all([
                getMeals(),
                getRecipes({ limit: 200 }),
                ShoppingAPI.getItems("1")
            ]);
            const loadedMeals = Array.isArray(mRes.data) ? mRes.data : [];
            setMeals(loadedMeals);
            setAllRecipes(Array.isArray(rRes.data) ? rRes.data : []);

            // Load ingredients for all meals and cross-check with shopping list
            const ingResults = await Promise.allSettled(
                loadedMeals.map(m => getMealIngredients(m._id))
            );
            const ingMap = {};
            const addedMap = {};
            loadedMeals.forEach((m, idx) => {
                if (ingResults[idx].status !== "fulfilled") return;
                const ings = ingResults[idx].value.data || [];
                const resolvedNames = new Set(
                    shoppingRes
                        .filter(s => s.meal_id === m._id)
                        .map(s => (s.name || "").toLowerCase())
                );
                ingMap[m._id] = ings.map(ing => ({
                    ...ing,
                    addedToList: resolvedNames.has(ing.name.toLowerCase()),
                    missing: ing.missing && !resolvedNames.has(ing.name.toLowerCase()),
                }));
                ings.forEach(ing => {
                    if (resolvedNames.has(ing.name.toLowerCase()))
                        addedMap[`${m._id}_${ing.name}`] = true;
                });
            });
            setIngredients(ingMap);
            setAddedIng(addedMap);
        } catch (err) {
            console.error("Load error:", err?.response?.data || err?.message);
            try { const r = await getMeals(); setMeals(Array.isArray(r.data) ? r.data : []); } catch { setMeals([]); }
            try { const r = await getRecipes({ limit: 200 }); setAllRecipes(Array.isArray(r.data) ? r.data : []); } catch { setAllRecipes([]); }
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    // ✓✓ When meal_type changes, fetch matching recipes ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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

    // ✓✓ Validation ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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

    // ✓✓ Submit ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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
                toast("Meal updated ✓", "success");
            } else {
                await createMeal(payload);
                toast("Meal created ✓", "success");
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

    // ✓✓ Edit ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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

    // ✓✓ Delete ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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

    // ✓✓ Pre-fill form from calendar slot ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
    const handleAddFromCalendar = (date, type) => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, meal_date: date, meal_type: type });
        setErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ✓✓ View 📖 Recipe Details ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
    const handleViewRecipe = (meal) => { setViewedMealId(meal._id); };

    // ✓✓ Expand row + load ingredients ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
    const handleExpandRow = async (mealId) => {
        const isOpen = expandedId === mealId;
        setExpandedId(isOpen ? null : mealId);
        if (!isOpen && !ingredients[mealId]) {
            try {
                const [ingRes, shoppingRes] = await Promise.all([
                    getMealIngredients(mealId),
                    ShoppingAPI.getItems("1")
                ]);
                const ings = ingRes.data || [];
                // Match by dedicated meal_id field ✓ reliable across refreshes
                const resolvedNames = new Set(
                    shoppingRes
                        .filter(s => s.meal_id === mealId)
                        .map(s => (s.name || "").toLowerCase())
                );
                const enriched = ings.map(ing => ({
                    ...ing,
                    addedToList: resolvedNames.has(ing.name.toLowerCase()),
                    missing: ing.missing && !resolvedNames.has(ing.name.toLowerCase()),
                }));
                setIngredients(p => ({ ...p, [mealId]: enriched }));
                // Pre-populate addedIng state
                const newAdded = {};
                enriched.forEach(ing => {
                    if (ing.addedToList) newAdded[`${mealId}_${ing.name}`] = true;
                });
                if (Object.keys(newAdded).length > 0) {
                    setAddedIng(p => ({ ...p, ...newAdded }));
                }
            } catch {
                setIngredients(p => ({ ...p, [mealId]: [] }));
            }
        }
    };

    // ✓✓ Add missing ingredient to shopping list ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
    const handleAddToShopping = async (ing) => {
        const key = `${ing.meal_id}_${ing.name}`;
        if (addedIng[key]) return; // prevent duplicate
        setAddingIng(p => ({ ...p, [key]: true }));
        try {
            const meal = meals.find(m => m._id === ing.meal_id);
            const payload = {
                user_id: "1",
                name: ing.name,
                quantity: ing.quantity || 1,
                unit: ing.unit || "",
                category: "meal-plan",
                source: "meal-plan",
                meal_id: ing.meal_id,
                notes: meal ? `From Meal: ${ing.recipe_title} (${meal.meal_date})` : `From Recipe: ${ing.recipe_title}`,
                status: "pending",
            };
            await ShoppingAPI.addItem(payload);
            // Mark as added in state
            setAddedIng(p => ({ ...p, [key]: true }));
            // Update ingredients state: mark this ingredient as no longer missing
            setIngredients(p => ({
                ...p,
                [ing.meal_id]: p[ing.meal_id].map(i =>
                    i.name === ing.name ? { ...i, missing: false, addedToList: true } : i
                )
            }));
            toast(`✓ "${ing.name}" added to Shopping List`, "success");
        } catch (err) {
            toast(`Failed to add "${ing.name}": ${err?.message || "Unknown error"}`, "error");
        } finally {
            setAddingIng(p => ({ ...p, [key]: false }));
        }
    };

    // ✓✓ Filtered meals ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
    const filtered = meals.filter(m => {
        const name = (m.recipe_title || allRecipes.find(r => r._id === m.recipe_id)?.title || "").toLowerCase();
        const mealStatus = (m.status || "planned").toLowerCase();
        const mealType = (m.meal_type || "").toLowerCase();
        return (
            (!search       || name.includes(search.toLowerCase())) &&
            (!filterType   || mealType === filterType.toLowerCase()) &&
            (!filterStatus || mealStatus === filterStatus.toLowerCase())
        );
    });

    const getRecipe = id => allRecipes.find(r => r._id === id);
    const isFiltering = !!(search || filterType || filterStatus);

    // ✓✓ Render ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
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
            {viewedMealId && (
                <RecipeDetailsModal
                    meal={meals.find(m => m._id === viewedMealId)}
                    recipe={getRecipe(meals.find(m => m._id === viewedMealId)?.recipe_id)}
                    onClose={() => setViewedMealId(null)}
                    ingredients={ingredients}
                    addedIng={addedIng}
                />
            )}

            {/* Header */}
            <div className="ms-header">
                <div className="ms-header-title">
                    <h1>🍽️ Meal Schedule</h1>
                    <p>Plan and manage your daily meals</p>
                </div>
                <div className="ms-header-filters">
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
                    {isFiltering && (
                        <button className="ms-btn ms-btn-ghost ms-btn-reset"
                            onClick={() => { setSearch(""); setFilterType(""); setFilterStatus(""); }}>
                            🔄 Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Form ✓ hidden when filtering */}
            {!isFiltering && (
            <div className="ms-card">
                <h2>{editingId ? "✏️ Edit Meal" : "🆕 New Meal"}</h2>
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

                        {/* Recipe ✓ filtered by meal type */}
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

                    {/* Description ✓ full width */}
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
                        <div className="ms-alert ms-alert-warning">✓️ {errors.duplicate}</div>
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
            )}

            {/* View Tabs ✓ hidden when filtering */}
            {!isFiltering && (
                <div className="ms-view-tabs">
                    {[["list","📋 List"],["daily","📅 Daily"],["weekly","� Weekly"],["monthly","📆 Monthly"]].map(([v,l]) => (
                        <button key={v} className={`ms-tab ${viewMode===v ? "ms-tab-active" : ""}`} onClick={() => setViewMode(v)}>{l}</button>
                    ))}
                </div>
            )}

            {!isFiltering && viewMode === "daily"   && <DailyView   meals={filtered} allRecipes={allRecipes} onEdit={handleEdit} onDelete={setDeleteId} onAdd={handleAddFromCalendar} onViewRecipe={handleViewRecipe} ingredients={ingredients} addingIng={addingIng} addedIng={addedIng} onAddToShopping={handleAddToShopping} />}
            {!isFiltering && viewMode === "weekly"  && <WeeklyView  meals={filtered} allRecipes={allRecipes} onEdit={handleEdit} onDelete={setDeleteId} onAdd={handleAddFromCalendar} onViewRecipe={handleViewRecipe} ingredients={ingredients} addingIng={addingIng} addedIng={addedIng} onAddToShopping={handleAddToShopping} />}
            {!isFiltering && viewMode === "monthly" && <MonthlyView meals={filtered} allRecipes={allRecipes} onEdit={handleEdit} onDelete={setDeleteId} onAdd={handleAddFromCalendar} onViewRecipe={handleViewRecipe} ingredients={ingredients} addingIng={addingIng} addedIng={addedIng} onAddToShopping={handleAddToShopping} />}

            {/* List View ✓ always shown when filtering, or when tab is list */}
            {(isFiltering || viewMode === "list") && (
            <div className="ms-card ms-table-card">
                {filtered.length === 0 && !loading ? (
                    <div className="ms-empty">
                        <div style={{ fontSize: "3rem" }}>🍽️</div>
                        <p>No meals found. Create your first meal above!</p>
                    </div>
                ) : (
                    <div className="ms-table-wrap">
                        <table className="ms-table">
                            <thead>
                                <tr>
                                    <th>📅 Date</th>
                                    <th>🍽️ Type</th>
                                    <th>📖 Recipe</th>
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
                                            <React.Fragment key={m._id}>
                                                <tr key={m._id} className="ms-row">
                                                    <td><strong>{m.meal_date}</strong></td>
                                                    <td>
                                                        <span className={`ms-type-chip ms-type-${m.meal_type}`}>
                                                            {m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="ms-link"
                                                            onClick={() => handleExpandRow(m._id)}>
                                                            {m.recipe_title || recipe?.title || m.recipe_id}
                                                            <span style={{ marginLeft: 4 }}>{isOpen ? "▼" : "▶"}</span>
                                                        </button>
                                                    </td>
                                                    <td className="ms-desc-cell">
                                                        {m.description
                                                            ? <Tooltip text={m.description}>
                                                                <span className="ms-desc-preview">{m.description.slice(0, 40)}{m.description.length > 40 ? "..." : ""}</span>
                                                              </Tooltip>
                                                            : <span className="ms-muted">—</span>}
                                                    </td>
                                                    <td><StatusBadge status={m.status || "planned"} /></td>
                                                    <td>
                                                        {(() => {
                                                            const ings = ingredients[m._id];
                                                            const unresolvedCount = ings
                                                                ? ings.filter(i => i.missing && !i.addedToList).length
                                                                : (m.warnings?.length || 0);
                                                            return unresolvedCount > 0 ? (
                                                                <Tooltip text={ings ? ings.filter(i => i.missing && !i.addedToList).map(i => i.name).join(", ") : m.warnings?.join(" | ")}>
                                                                    <span className="ms-warn-badge">
                                                                        ⚠️ {unresolvedCount} missing
                                                                    </span>
                                                                </Tooltip>
                                                            ) : (
                                                                <span className="ms-ok-badge">✅ OK</span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="ms-actions">
                                                        {(() => {
                                                            const ings = ingredients[m._id];
                                                            const missingIngs = ings ? ings.filter(i => i.missing && !i.addedToList) : [];
                                                            return missingIngs.length > 0 ? (
                                                                <button
                                                                    className="ms-btn-action ms-btn-action-shopping"
                                                                    onClick={() => missingIngs.forEach(ing => handleAddToShopping(ing))}
                                                                    disabled={missingIngs.some(ing => addingIng[`${ing.meal_id}_${ing.name}`])}
                                                                >
                                                                    🛒 Add to Shopping
                                                                </button>
                                                            ) : null;
                                                        })()}
                                                        <div className="ms-actions-row">
                                                            <button className="ms-btn-action ms-btn-action-view"
                                                                onClick={() => handleViewRecipe(m)}>👁️ View</button>
                                                            <button className="ms-btn-action ms-btn-action-edit"
                                                                onClick={() => handleEdit(m)}>✏️ Edit</button>
                                                            <button className="ms-btn-action ms-btn-action-delete"
                                                                onClick={() => setDeleteId(m._id)}>🗑️ Delete</button>
                                                        </div>
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
                                                                            {/* 🥘 Ingredients with Missing Status */}
                                                                            <div className="ms-detail-section">
                                                                                <h4 className="ms-section-title">🥘 Ingredients</h4>
                                                                                {ingredients[m._id]?.length > 0 ? (
                                                                                    <ul className="ms-ing-list">
                                                                                        {ingredients[m._id].map((ing, i) => {
                                                                                            const key = `${ing.meal_id}_${ing.name}`;
                                                                                            const isAdding = addingIng[key];
                                                                                            const isAdded = ing.addedToList || addedIng[key];
                                                                                            const isMissing = ing.missing && !isAdded;
                                                                                            return (
                                                                                                <li key={key} className={`ms-ing-row ${isMissing ? "ms-ing-row-missing" : isAdded ? "ms-ing-row-added" : "ms-ing-row-ok"}`}>
                                                                                                    <div className="ms-ing-left">
                                                                                                        <span className="ms-ing-qty">{ing.quantity} {ing.unit}</span>
                                                                                                        <span className="ms-ing-name">{ing.name}</span>
                                                                                                    </div>
                                                                                                    <div className="ms-ing-right">
                                                                                                        {isMissing && (
                                                                                                            <>
                                                                                                                <span className="ms-ing-badge ms-ing-badge-missing">✓️ Missing</span>
                                                                                                                <button
                                                                                                                    className="ms-btn ms-btn-sm ms-btn-shopping"
                                                                                                                    onClick={() => handleAddToShopping(ing)}
                                                                                                                    disabled={isAdding}
                                                                                                                >
                                                                                                                    {isAdding ? "⏳ Adding..." : "✓ Add to Shopping List"}
                                                                                                                </button>
                                                                                                            </>
                                                                                                        )}
                                                                                                        {isAdded && (
                                                                                                            <span className="ms-ing-badge ms-ing-badge-added">✓ Added to Shopping List</span>
                                                                                                        )}
                                                                                                        {!isMissing && !isAdded && (
                                                                                                            <span className="ms-ing-badge ms-ing-badge-ok">✓ Available</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </li>
                                                                                            );
                                                                                        })}
                                                                                    </ul>
                                                                                ) : (
                                                                                    <p className="ms-muted">Loading ingredients...</p>
                                                                                )}
                                                                            </div>

                                                                            {/* 👨‍🍳 Preparation Steps */}
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
                                                                        <strong>✓️ ⚠️ Inventory Warnings:</strong>
                                                                        <ul>{m.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
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
            )}
        </div>
    );
}
