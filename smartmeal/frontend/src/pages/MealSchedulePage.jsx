import { useEffect, useState } from "react";
import {
    getMeals,
    createMeal,
    updateMeal,
    deleteMeal
} from "../services/mealService";
import { getRecipes } from "../api/recipes";

export default function MealSchedulePage(){

    const [meals,setMeals] = useState([]);
    const [recipes,setRecipes] = useState([]);
    const [editingId,setEditingId] = useState(null);

    const [form,setForm] = useState({
        meal_date:"",
        meal_type:"",
        recipe_id:""
    });

    const mealTypes = [
        "Breakfast",
        "Lunch",
        "Dinner"
    ];

    const loadData = async()=>{
        try{
            const [mealsRes, recipesRes] = await Promise.all([
                getMeals(),
                getRecipes()
            ]);
            setMeals(mealsRes.data);
            setRecipes(recipesRes.data);
        }catch(err){
            console.error("Failed to load data:", err?.response?.data || err?.message || err);
        }
    };

    useEffect(()=>{
        loadData();
    },[]);

    const handleSubmit = async()=>{
        try{

            if(!form.meal_date || !form.meal_type || !form.recipe_id){
                alert("Please fill all fields");
                return;
            }

            const payload = {
                user_id:"1",   // In a real app, this should come from auth context
                recipe_id:form.recipe_id,
                meal_date:form.meal_date,
                meal_type:form.meal_type,
                status:"planned"
            };

            if(editingId){
                await updateMeal(editingId,payload);
            }else{
                await createMeal(payload);
            }

            setForm({
                meal_date:"",
                meal_type:"",
                recipe_id:""
            });

            setEditingId(null);
            loadData();

        }catch(err){
            const status = err?.response?.status;
            const data = err?.response?.data;
            const detail =
                (typeof data === "string" ? data : data?.detail) ??
                (data ? JSON.stringify(data) : null) ??
                err?.message ??
                "Unknown error";

            console.error("Meal operation failed:", { status, data, err });
            alert(`Operation failed${status ? ` (${status})` : ""}: ${detail}`);
        }
    };

    const handleEdit = (meal)=>{
        setEditingId(meal._id);

        setForm({
            meal_date:meal.meal_date,
            meal_type:meal.meal_type,
            recipe_id:meal.recipe_id
        });
    };

    const handleDelete = async(id)=>{
        if(window.confirm("Are you sure you want to delete this meal?")){
            await deleteMeal(id);
            loadData();
        }
    };

    return(
        <div className="container" style={{padding:"2rem"}}>
            <h2 className="mb-4" style={{color:"var(--primary)"}}>
                Meal Schedule Management
            </h2>

            <div className="card mb-4" style={{padding:"1.5rem"}}>
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.meal_date}
                            onChange={e=>setForm({...form,meal_date:e.target.value})}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Meal Type</label>
                        <select
                            className="form-select"
                            value={form.meal_type}
                            onChange={e=>setForm({...form,meal_type:e.target.value})}
                        >
                            <option value="">Select Meal Type</option>
                            {mealTypes.map(m=>(
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label">Recipe</label>
                        <select
                            className="form-select"
                            value={form.recipe_id}
                            onChange={e=>setForm({...form,recipe_id:e.target.value})}
                        >
                            <option value="">Select Recipe</option>
                            {recipes.map(r=>(
                                <option key={r._id} value={r._id}>{r.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-2 d-flex align-items-end">
                        <button
                            className="btn btn-primary w-100"
                            onClick={handleSubmit}
                        >
                            {editingId ? "Update" : "Create"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden">
                <table className="table table-hover mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>Date</th>
                            <th>Meal Type</th>
                            <th>Recipe</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {meals.length > 0 ? meals.map(m=>(
                            <tr key={m._id}>
                                <td>{m.meal_date}</td>
                                <td>{m.meal_type}</td>
                                <td>{recipes.find(r => r._id === m.recipe_id)?.title || m.recipe_id}</td>
                                <td className="text-end">
                                    <button
                                        className="btn btn-sm btn-outline-warning me-2"
                                        onClick={()=>handleEdit(m)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={()=>handleDelete(m._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center py-4 text-muted">
                                    No meals scheduled yet.
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>
        </div>
    );
}
