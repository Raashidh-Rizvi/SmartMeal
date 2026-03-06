import Navbar from "../components/Navbar";
import { RECIPES } from "../data/recipes";

export default function RecipePage(){

    return(
        <div>
            <Navbar/>

            <div style={{padding:"30px"}}>

                <h2 style={{color:"#16a34a"}}>
                    Recipes List
                </h2>

                <ul>
                    {RECIPES.map(r=>(
                        <li key={r} style={{
                            padding:"10px",
                            borderBottom:"1px solid #ddd"
                        }}>
                            {r}
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
}