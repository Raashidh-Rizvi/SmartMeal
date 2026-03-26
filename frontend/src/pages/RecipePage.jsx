import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getRecipes } from "../services/recipeService";

export default function RecipePage() {
    const [recipes, setRecipes] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getRecipes().then(res => setRecipes(res.data)).catch(console.error);
    }, []);

    return (
        <div>
            <Navbar />
            <div style={{ padding: "30px" }}>
                <h2 style={{ color: "#16a34a" }}>Recipes List</h2>
                <ul>
                    {recipes.map(r => (
                        <li
                            key={r._id}
                            style={{ padding: "10px", borderBottom: "1px solid #ddd", cursor: "pointer" }}
                            onClick={() => navigate("/recipes")}
                        >
                            {r.title} — <em>{r.category}</em>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
