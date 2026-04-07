import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function AdminUserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'USER',
    is_active: true,
    preferences: {
      dietType: '',
      budgetLevel: '',
      householdSize: 1
    }
  });

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get(`/api/admin/users/${id}`);
      setUser(res.data);
      setFormData({
        name: res.data.name || '',
        role: res.data.role || 'USER',
        is_active: res.data.is_active !== undefined ? res.data.is_active : true,
        preferences: {
          dietType: res.data.preferences?.dietType || '',
          budgetLevel: res.data.preferences?.budgetLevel || '',
          householdSize: res.data.preferences?.householdSize || 1
        }
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load user');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('pref_')) {
      const prefName = name.replace('pref_', '');
      let finalValue = value;
      if (prefName === 'householdSize') {
          finalValue = parseInt(value, 10) || 0;
      }
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefName]: finalValue
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/admin/users/${id}`, formData);
      alert('User updated successfully');
      navigate('/admin/users');
    } catch (err) {
      console.error('Update failed:', err);
      const errorMsg = err.response?.data?.detail;
      if (Array.isArray(errorMsg)) {
        alert('Validation error: ' + JSON.stringify(errorMsg));
      } else {
        alert(errorMsg || 'Failed to update user');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading user details...</div>;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Edit User: {user?.email}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>Back</button>
      </header>

      <div className="admin-card">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="admin-input"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              className="admin-input"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <input 
              type="checkbox" 
              id="is_active"
              name="is_active" 
              checked={formData.is_active} 
              onChange={handleCheckboxChange} 
              style={{ width: 'auto', margin: 0 }}
            />
            <label htmlFor="is_active" style={{ margin: 0 }}>Active Account</label>
          </div>

          <h3 className="section-title">Preferences</h3>
          
          <div className="form-group">
            <label>Diet Type</label>
            <input 
              type="text" 
              name="pref_dietType" 
              value={formData.preferences.dietType} 
              onChange={handleChange} 
              className="admin-input"
            />
          </div>

          <div className="form-group">
            <label>Budget Level</label>
            <select 
              name="pref_budgetLevel" 
              value={formData.preferences.budgetLevel} 
              onChange={handleChange} 
              className="admin-input"
            >
              <option value="">None</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Household Size</label>
            <input 
              type="number" 
              name="pref_householdSize" 
              value={formData.preferences.householdSize} 
              onChange={handleChange} 
              min="1"
              className="admin-input"
            />
          </div>

          <div className="form-actions mt-4">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminUserEdit;
