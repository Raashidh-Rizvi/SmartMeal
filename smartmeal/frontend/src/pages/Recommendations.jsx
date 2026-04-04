import React, { useState } from 'react';
import { getRecommendations, rateRecipe } from '../api/recipes';
import { 
  Star, 
  Clock, 
  Filter, 
  ArrowLeft, 
  Sparkles, 
  Flame, 
  Leaf, 
  Utensils 
} from 'lucide-react';

function Recommendations() {
  const [preferences, setPreferences] = useState({
    spicy: null, // true/false/null
    cooking_time_max: '',
    diet: '' // 'veg', 'non-veg', ''
  });
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const filters = {
        spicy: preferences.spicy,
        cooking_time_max: preferences.cooking_time_max ? parseInt(preferences.cooking_time_max) : undefined,
        diet: preferences.diet,
        limit: 20
      };
      const response = await getRecommendations(filters);
      setRecipes(response.data);
      setSubmitted(true);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (recipeId, rating) => {
    try {
      await rateRecipe(recipeId, rating);
      // Update local state
      setRecipes(prev => prev.map(recipe =>
        recipe._id === recipeId ? { ...recipe, average_rating: rating } : recipe
      ));
    } catch (error) {
      console.error('Error rating recipe:', error);
    }
  };

  const renderStars = (recipe) => {
    const rating = recipe.average_rating || 0;
    return (
      <div className="rating-stars" style={{ display: 'flex', gap: '0.2rem' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => handleRating(recipe._id, star)}
            style={{ cursor: 'pointer' }}
          >
            <Star 
              size={16} 
              fill={star <= rating ? "var(--warning, #f59e0b)" : "none"} 
              stroke={star <= rating ? "var(--warning, #f59e0b)" : "currentColor"} 
            />
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="recommendations-page" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Sparkles size={32} color="var(--primary)" />
        Recipe Recommendations
      </h2>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="card preferences-form" style={{ padding: '2rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={18} color="#ef4444" /> Do you want spicy food?
            </label>
            <button
              type="button"
              className={`toggle-btn ${preferences.spicy === true ? 'active' : ''}`}
              onClick={() => handlePreferenceChange('spicy', preferences.spicy === true ? null : true)}
              style={{ padding: '0.5rem 1rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span className="toggle-label">
                {preferences.spicy === true ? 'Yes' : 'No'}
              </span>
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="cooking_time" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Maximum cooking time (minutes):
            </label>
            <input
              type="number"
              id="cooking_time"
              value={preferences.cooking_time_max}
              onChange={(e) => handlePreferenceChange('cooking_time_max', e.target.value)}
              placeholder="e.g., 30"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="diet" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Leaf size={18} color="#10b981" /> Diet preference:
            </label>
            <select
              id="diet"
              value={preferences.diet}
              onChange={(e) => handlePreferenceChange('diet', e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            >
              <option value="">Any</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Filter size={20} />
            {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
          </button>
        </form>
      ) : (
        <div className="recommendations-results">
          <button onClick={() => setSubmitted(false)} className="btn-secondary back-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <ArrowLeft size={18} /> Change Preferences
          </button>

          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Utensils size={24} color="var(--primary)" /> Recommended Recipes
          </h3>
          
          {recipes.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Filter size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
              <p>No recipes found matching your preferences.</p>
            </div>
          ) : (
            <div className="recipes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {recipes.map(recipe => (
                <div key={recipe._id} className="card recipe-card" style={{ padding: '1rem' }}>
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="recipe-image" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '100%', height: '180px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Utensils size={48} color="#cbd5e1" />
                    </div>
                  )}
                  <h4 style={{ margin: '1rem 0 0.5rem' }}>{recipe.title}</h4>
                  {renderStars(recipe)}
                  <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
                    Rating: {recipe.average_rating ? recipe.average_rating.toFixed(1) : 'Not rated'}
                  </p>
                  {recipe.estimated_cooking_time && (
                    <p className="text-muted" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} /> {recipe.estimated_cooking_time} min
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Recommendations;
