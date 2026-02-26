import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    dietType: '',
    allergies: '',
    cuisinePreferences: '',
    budgetLevel: '',
    householdSize: 1
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        dietType: user.preferences?.dietType || '',
        allergies: user.preferences?.allergies?.join(', ') || '',
        cuisinePreferences: user.preferences?.cuisinePreferences?.join(', ') || '',
        budgetLevel: user.preferences?.budgetLevel || '',
        householdSize: user.preferences?.householdSize || 1
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updatePayload = {
        name: formData.name,
        email: user.email, // Kept for UserBase validation
        preferences: {
          dietType: formData.dietType,
          allergies: formData.allergies.split(',').map(i => i.trim()).filter(i => i),
          cuisinePreferences: formData.cuisinePreferences.split(',').map(i => i.trim()).filter(i => i),
          budgetLevel: formData.budgetLevel,
          householdSize: parseInt(formData.householdSize, 10) || 1
        }
      };

      const response = await api.put('/api/users/me', updatePayload);
      setUser(response.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-container card">
      <h2>My Profile</h2>
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Name</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Email (cannot be changed here)</label>
          <input 
            type="email" 
            value={user.email} 
            disabled 
            readOnly 
          />
        </div>

        <h3>Dietary Preferences</h3>
        
        <div className="form-group">
          <label>Diet Type</label>
          <select name="dietType" value={formData.dietType} onChange={handleChange}>
            <option value="">None</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="pescatarian">Pescatarian</option>
            <option value="keto">Keto</option>
            <option value="paleo">Paleo</option>
          </select>
        </div>

        <div className="form-group">
          <label>Allergies (comma-separated)</label>
          <input 
            type="text" 
            name="allergies" 
            value={formData.allergies} 
            onChange={handleChange} 
            placeholder="e.g. peanuts, dairy, gluten"
          />
        </div>

        <div className="form-group">
          <label>Cuisine Preferences (comma-separated)</label>
          <input 
            type="text" 
            name="cuisinePreferences" 
            value={formData.cuisinePreferences} 
            onChange={handleChange} 
            placeholder="e.g. Italian, Mexican, Asian"
          />
        </div>

        <div className="form-group">
          <label>Budget Level</label>
          <select name="budgetLevel" value={formData.budgetLevel} onChange={handleChange}>
            <option value="">Select...</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-group">
          <label>Household Size</label>
          <input 
            type="number" 
            name="householdSize" 
            value={formData.householdSize} 
            onChange={handleChange} 
            min="1"
            max="20"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="profile-links">
         <Link to="/change-password">Change Password</Link>
         <Link to="/delete-account" className="text-danger">Delete Account</Link>
      </div>
    </div>
  );
}

export default Profile;
