import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getRecipeById, generateAIRecipe } from '../../api/recipes';
import AIRecipePanel from '../../components/AIRecipePanel';
import './recipes.css';
import {
    ArrowLeft,
    Clock,
    Users,
    ChefHat,
    Check,
    Sparkles
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

function RecipeDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // AI state
    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const aiPanelRef = useRef(null);

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const res = await getRecipeById(id);
                setRecipe(res.data);
            } catch (err) {
                setError('Could not load recipe details.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecipe();
    }, [id]);

    const handleGenerateAIRecipe = async () => {
        if (!recipe) return;
        setAiLoading(true);
        setAiData(null);
        
        setTimeout(() => {
            if (aiPanelRef.current) {
                aiPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);

        try {
            const ingredientString = recipe.ingredients.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ');
            const payload = {
                ingredients: ingredientString,
                cuisine: recipe.title,
            };
            const res = await generateAIRecipe(payload);
            setAiData(res.data);
        } catch (err) {
            setAiData({ error: true, message: err.response?.data?.detail || 'AI generation failed.' });
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="recipe-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading recipe...</p>
                </div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="recipe-page">
                <div className="recipe-tabs-container premium-nav-bar">
                    <div className="recipe-tabs align-side-by-side">
                        <button className="recipe-tab" onClick={() => navigate(-1)}>
                            <ArrowLeft size={18} /> Back
                        </button>
                    </div>
                </div>
                <div className="error" style={{ margin: '2rem' }}>{error || 'Recipe not found.'}</div>
            </div>
        );
    }

    return (
        <div className="recipe-page">
            {/* Top Navigation */}
            <div className="recipe-tabs-container premium-nav-bar">
                <div className="recipe-tabs align-side-by-side">
                    <button className="recipe-tab" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
            </div>

            <div className="recipe-detail">
                {recipe.image_url && (
                    <img
                        src={recipe.image_url.startsWith('/') ? `${API_BASE_URL}${recipe.image_url}` : recipe.image_url}
                        alt={recipe.title}
                        className="recipe-hero-img"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                )}

                <div className="recipe-detail-header">
                    <div>
                        <span className={`badge badge-${recipe.category} badge-lg`}>
                            {recipe.category}
                        </span>
                        <h1 className="recipe-detail-title">{recipe.title}</h1>
                        {recipe.description && (
                            <p className="recipe-detail-desc">{recipe.description}</p>
                        )}
                        <div className="recipe-meta">
                            {recipe.estimated_cooking_time && (
                                <div className="recipe-meta-item">
                                    <Clock size={18} color="var(--primary)" />
                                    <span>{recipe.estimated_cooking_time} min cook time</span>
                                </div>
                            )}
                            <div className="recipe-meta-item">
                                <Users size={18} color="var(--primary)" />
                                <span>{recipe.ingredients.length} ingredients</span>
                            </div>
                            <div className="recipe-meta-item">
                                <ChefHat size={18} color="var(--primary)" />
                                <span>{recipe.preparation_steps.length} steps</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dietary Tags */}
                {recipe.dietary_tags?.length > 0 && (
                    <div className="tag-chips">
                        {recipe.dietary_tags.map(tag => (
                            <span key={tag} className="tag-chip">
                                <Check size={12} /> {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Ingredients */}
                <section className="recipe-section">
                    <h2 className="recipe-section-title">
                        <Users size={24} color="var(--primary)" /> Ingredients
                    </h2>
                    <table className="ingredient-table">
                        <thead>
                            <tr>
                                <th>Ingredient</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recipe.ingredients.map((ing, i) => (
                                <tr key={i}>
                                    <td>{ing.name}</td>
                                    <td>{ing.quantity}</td>
                                    <td>{ing.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Preparation Steps */}
                <section className="recipe-section">
                    <h2 className="recipe-section-title">
                        <ChefHat size={24} color="var(--primary)" /> Preparation Steps
                    </h2>
                    <ol className="steps-list">
                        {recipe.preparation_steps.map((step, i) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ol>
                </section>

                {/* Action Buttons */}
                <div className="recipe-detail-actions-footer">
                    <button
                        className="action-edit detail-action-btn"
                        onClick={handleGenerateAIRecipe}
                        disabled={aiLoading}
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none' }}
                    >
                        <Sparkles size={18} /> {aiLoading ? 'Generating...' : 'AI Recipe'}
                    </button>
                </div>
                
                <div ref={aiPanelRef} style={{ marginTop: '2rem' }}>
                    {(aiLoading || aiData) && (
                        <AIRecipePanel
                            data={aiData}
                            loading={aiLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default RecipeDetailsPage;
