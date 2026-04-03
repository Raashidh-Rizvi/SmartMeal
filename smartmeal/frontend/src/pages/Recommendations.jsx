import React, { useState } from 'react';
import { getRecommendations, rateRecipe } from '../api/recipes';

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
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => handleRating(recipe._id, star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="recommendations-page">
      <h2>Recipe Recommendations</h2>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="preferences-form">
          <div className="form-group">
            <label>Do you want spicy food?</label>
            <button
              type="button"
              className={`toggle-btn ${preferences.spicy === true ? 'active' : ''}`}
              onClick={() => handlePreferenceChange('spicy', preferences.spicy === true ? null : true)}
            >
              <span className="toggle-knob"></span>
              <span className="toggle-label">
                {preferences.spicy === true ? 'Yes' : 'No'}
              </span>
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="cooking_time">Maximum cooking time (minutes):</label>
            <input
              type="number"
              id="cooking_time"
              value={preferences.cooking_time_max}
              onChange={(e) => handlePreferenceChange('cooking_time_max', e.target.value)}
              placeholder="e.g., 30"
            />
          </div>

          <div className="form-group">
            <label htmlFor="diet">Diet preference:</label>
            <select
              id="diet"
              value={preferences.diet}
              onChange={(e) => handlePreferenceChange('diet', e.target.value)}
            >
              <option value="">Any</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
          </button>
        </form>
      ) : (
        <div className="recommendations-results">
          <button onClick={() => setSubmitted(false)} className="back-button">
            Change Preferences
          </button>

          <h3>Recommended Recipes</h3>
          {recipes.length === 0 ? (
            <p>No recipes found matching your preferences.</p>
          ) : (
            <div className="recipes-grid">
              {recipes.map(recipe => (
                <div key={recipe._id} className="recipe-card">
                  {recipe.image_url && (
                    <img src={recipe.image_url} alt={recipe.title} className="recipe-image" />
                  )}
                  <h4>{recipe.title}</h4>
                  {renderStars(recipe)}
                  <p>Rating: {recipe.average_rating ? recipe.average_rating.toFixed(1) : 'Not rated'}</p>
                  {recipe.estimated_cooking_time && (
                    <p>Cooking time: {recipe.estimated_cooking_time} min</p>
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
