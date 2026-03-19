import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
    getMeals,
    createMeal,
    updateMeal,
    deleteMeal
} from "../services/mealService";
import { RECIPES } from "../data/recipes";

export default function MealSchedulePage(){

    const [meals,setMeals] = useState([]);
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

    const loadMeals = async()=>{
        try{
            const res = await getMeals();
            setMeals(res.data);
        }catch(err){
            console.error("Failed to load meals:", err?.response?.data || err?.message || err);
        }
    };

    useEffect(()=>{
        loadMeals();
    },[]);

    const handleSubmit = async()=>{
        try{

            if(!form.meal_date || !form.meal_type || !form.recipe_id){
                alert("Please fill all fields");
                return;
            }

            const payload = {
                user_id:"1",   // required
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
            loadMeals();

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
        await deleteMeal(id);
        loadMeals();
    };

    return(
        <div>
            <Navbar/>

            <div style={{padding:"30px",maxWidth:"900px",margin:"auto"}}>

                <h2 style={{color:"#16a34a"}}>
                    Meal Schedule Management
                </h2>

                <div style={{
                    background:"#f0fdf4",
                    padding:"20px",
                    borderRadius:"10px",
                    marginBottom:"20px"
                }}>

                    <input
                        type="date"
                        value={form.meal_date}
                        onChange={e=>setForm({...form,meal_date:e.target.value})}
                        style={{width:"100%",padding:"10px",marginBottom:"10px"}}
                    />

                    <select
                        value={form.meal_type}
                        onChange={e=>setForm({...form,meal_type:e.target.value})}
                        style={{width:"100%",padding:"10px",marginBottom:"10px"}}
                    >
                        <option value="">Select Meal Type</option>
                        {mealTypes.map(m=>(
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={form.recipe_id}
                        onChange={e=>setForm({...form,recipe_id:e.target.value})}
                        style={{width:"100%",padding:"10px",marginBottom:"10px"}}
                    >
                        <option value="">Select Recipe</option>
                        {RECIPES.map(r=>(
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSubmit}
                        style={{
                            background:"#16a34a",
                            color:"white",
                            padding:"10px 15px",
                            border:"none",
                            cursor:"pointer"
                        }}
                    >
                        {editingId ? "Update Meal" : "Create Meal"}
                    </button>

                </div>

                <table width="100%" border="1" cellPadding="10">
                    <thead style={{background:"#ecfccb"}}>
                        <tr>
                            <th>Date</th>
                            <th>Meal Type</th>
                            <th>Recipe</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {meals.map(m=>(
                            <tr key={m._id}>
                                <td>{m.meal_date}</td>
                                <td>{m.meal_type}</td>
                                <td>{m.recipe_id}</td>
                                <td>
                                    <button
                                        onClick={()=>handleEdit(m)}
                                        style={{
                                            background:"#f97316",
                                            color:"white",
                                            marginRight:"8px",
                                            padding:"5px 10px"
                                        }}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={()=>handleDelete(m._id)}
                                        style={{
                                            background:"#ef4444",
                                            color:"white",
                                            padding:"5px 10px"
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>

            </div>
        </div>
    );
}