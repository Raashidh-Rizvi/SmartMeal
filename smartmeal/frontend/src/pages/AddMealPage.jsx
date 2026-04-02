import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createMeal } from "../services/mealService";
import { getRecipes } from "../api/recipes";

export default function AddMealPage() {
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        meal_date: "",
        meal_type: "",
        recipe_id: ""
    });

    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

    useEffect(() => {
        getRecipes().then(res => setRecipes(res.data)).catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            if (!form.meal_date || !form.meal_type || !form.recipe_id) {
                setError("Please fill all fields");
                return;
            }

            const payload = {
                user_id: "1",
                recipe_id: form.recipe_id,
                meal_date: form.meal_date,
                meal_type: form.meal_type,
                status: "planned"
            };

            await createMeal(payload);
            setSuccess("✅ Meal created successfully!");
            setTimeout(() => navigate("/meals", { state: { created: true } }), 1200);
        } catch (err) {
            console.error("Failed to create meal:", err);
            const msg = err?.response?.data?.detail || "Failed to create meal";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        }
    };

    return (
        <div className="container" style={{ padding: "2rem", maxWidth: "600px" }}>
            <div className="card">
                <div className="card-body">
                    <h2 className="card-title mb-4">Add New Meal</h2>

                    {success && (
                        <div className="alert alert-success" role="alert" style={{ marginBottom: "1rem" }}>
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger" role="alert" style={{ marginBottom: "1rem" }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={form.meal_date}
                                onChange={e => setForm({ ...form, meal_date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Meal Type</label>
                            <select
                                className="form-select"
                                value={form.meal_type}
                                onChange={e => setForm({ ...form, meal_type: e.target.value })}
                                required
                            >
                                <option value="">Select Meal Type</option>
                                {mealTypes.map(m => (
                                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label">Recipe</label>
                            <select
                                className="form-select"
                                value={form.recipe_id}
                                onChange={e => setForm({ ...form, recipe_id: e.target.value })}
                                required
                            >
                                <option value="">Select Recipe</option>
                                {recipes.map(r => (
                                    <option key={r._id} value={r._id}>{r.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-primary" disabled={!!success}>Schedule Meal</button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/meals")}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
