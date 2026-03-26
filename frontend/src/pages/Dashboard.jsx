import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getMeals } from "../services/mealService";
import { getRecipes } from "../services/recipeService";

export default function Dashboard(){

    const [meals,setMeals] = useState([]);
    const [recipes, setRecipes] = useState([]);

    const loadMeals = async()=>{
        try{
            const res = await getMeals();
            setMeals(res.data);
        }catch(err){
            console.log(err);
        }
    };

    const loadRecipes = async()=>{
        try{
            const res = await getRecipes();
            setRecipes(res.data);
        }catch(err){
            console.log(err);
        }
    };

    useEffect(()=>{
        loadMeals();
        loadRecipes();
    },[]);

    return(
        <div>
            <Navbar/>

            <div style={{padding:"30px"}}>

                <h1 style={{color:"#16a34a"}}>
                    Smart Meal Planner Dashboard
                </h1>

                <div
                    style={{
                        marginTop:"30px",
                        display:"grid",
                        gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",
                        gap:"20px"
                    }}
                >
                    <div style={{
                        background:"#f0fdf4",
                        padding:"24px",
                        borderRadius:"12px"
                    }}>
                        <h3>Total Meals Planned</h3>
                        <h1 style={{fontSize:"40px", margin:"10px 0"}}>
                            {meals.length}
                        </h1>
                        <p style={{margin:0,color:"#4b5563"}}>
                            All meals you have scheduled in the planner.
                        </p>
                    </div>

                    <div style={{
                        background:"#f0fdf4",
                        padding:"24px",
                        borderRadius:"12px"
                    }}>
                        <h3>Total Recipes Available</h3>
                        <h1 style={{fontSize:"40px", margin:"10px 0"}}>
                            {recipes.length}
                        </h1>
                        <p style={{margin:0,color:"#4b5563"}}>
                            Number of different recipe options you can choose from.
                        </p>
                    </div>

                    <div style={{
                        background:"#f0fdf4",
                        padding:"24px",
                        borderRadius:"12px"
                    }}>
                        <h3>Quick Tips</h3>
                        <ul style={{marginTop:"10px", paddingLeft:"20px", color:"#4b5563"}}>
                            <li>Use the <strong>Meal Schedule</strong> page to plan meals.</li>
                            <li>You can only have <strong>one meal</strong> per date &amp; meal type.</li>
                            <li>Check the <strong>Recipes</strong> page to see all recipe names.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}