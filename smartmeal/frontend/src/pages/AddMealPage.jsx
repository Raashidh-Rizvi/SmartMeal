import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createMeal } from "../services/mealService";
import { getRecipes } from "../api/recipes";
import { 
  Calendar, 
  Utensils, 
  BookOpen, 
  Check, 
  X, 
  PlusCircle, 
  ArrowLeft 
} from "lucide-react";

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

            const today = new Date().toISOString().slice(0, 10);
            if (form.meal_date < today) {
                setError("Cannot create meal plans for past dates. Please select today or a future date.");
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
            setSuccess("Meal created successfully!");
            setTimeout(() => navigate("/meals", { state: { created: true } }), 1200);
        } catch (err) {
            console.error("Failed to create meal:", err);
            const msg = err?.response?.data?.detail || "Failed to create meal";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        }
    };

    return (
        <div className="container" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <div className="card">
                <div className="card-body" style={{ padding: "2rem" }}>
                    <h2 className="card-title mb-4" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <PlusCircle size={28} color="var(--primary)" />
                        Add New Meal
                    </h2>

                    {success && (
                        <div className="alert alert-success" role="alert" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Check size={18} /> {success}
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger" role="alert" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <X size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <Calendar size={18} /> Date
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={form.meal_date}
                                onChange={e => setForm({ ...form, meal_date: e.target.value })}
                                min={new Date().toISOString().slice(0, 10)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <Utensils size={18} /> Meal Type
                            </label>
                            <select
                                className="form-select"
                                value={form.meal_type}
                                onChange={e => setForm({ ...form, meal_type: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                                required
                            >
                                <option value="">Select Meal Type</option>
                                {mealTypes.map(m => (
                                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <BookOpen size={18} /> Recipe
                            </label>
                            <select
                                className="form-select"
                                value={form.recipe_id}
                                onChange={e => setForm({ ...form, recipe_id: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                                required
                            >
                                <option value="">Select Recipe</option>
                                {recipes.map(r => (
                                    <option key={r._id} value={r._id}>{r.title}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
                            <button type="submit" className="btn-primary" disabled={!!success} style={{ padding: "1rem", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                <Calendar size={20} /> Schedule Meal
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => navigate("/meals")} style={{ padding: "1rem", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                <ArrowLeft size={20} /> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
