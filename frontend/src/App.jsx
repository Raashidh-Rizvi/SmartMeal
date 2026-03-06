import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MealSchedulePage from "./pages/MealSchedulePage";
import RecipePage from "./pages/RecipePage";
import AddMealPage from "./pages/AddMealPage"; // optional if you want a separate add page

function App() {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/meals" element={<MealSchedulePage />} />
            <Route path="/recipes" element={<RecipePage />} />
            <Route path="/add-meal" element={<AddMealPage />} /> {/* optional */}
        </Routes>
    );
}

export default App;