import { useState } from "react";
import { createMeal } from "../services/mealService";

export default function AddMealPage(){

    const [form,setForm] = useState({
        meal_date:"",
        meal_type:"",
        recipe_id:"",
        user_id:"1"
    });

    const handleSubmit = async () => {
        try{
            await createMeal(form);

            alert("Meal Added Successfully");

            setForm({
                meal_date:"",
                meal_type:"",
                recipe_id:"",
                user_id:"1"
            });

        }catch(err){
            const status = err?.response?.status;
            const data = err?.response?.data;
            const detail =
                (typeof data === "string" ? data : data?.detail) ??
                (data ? JSON.stringify(data) : null) ??
                err?.message ??
                "Unknown error";

            console.error("Add meal failed:", { status, data, err });
            alert(`Failed to add meal${status ? ` (${status})` : ""}: ${detail}`);
        }
    };

    return(
        <div style={{padding:"30px"}}>
            <h2>Add Meal Plan</h2>

            <input
                type="date"
                value={form.meal_date}
                onChange={e=>setForm({...form,meal_date:e.target.value})}
                style={{width:"100%",padding:"10px",marginBottom:"10px"}}
            />

            <input
                placeholder="Meal Type"
                value={form.meal_type}
                onChange={e=>setForm({...form,meal_type:e.target.value})}
                style={{width:"100%",padding:"10px",marginBottom:"10px"}}
            />

            <input
                placeholder="Recipe"
                value={form.recipe_id}
                onChange={e=>setForm({...form,recipe_id:e.target.value})}
                style={{width:"100%",padding:"10px",marginBottom:"10px"}}
            />

            <button
                onClick={handleSubmit}
                style={{
                    background:"#16a34a",
                    color:"white",
                    padding:"10px 15px",
                    border:"none"
                }}
            >
                Save Meal
            </button>

        </div>
    );
}