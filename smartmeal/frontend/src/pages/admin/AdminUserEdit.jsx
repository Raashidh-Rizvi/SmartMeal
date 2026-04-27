import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  User, 
  Shield, 
  Settings, 
  Mail, 
  Users, 
  Save, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  Briefcase,
  Layers,
  Activity,
  Lock
} from 'lucide-react';

function AdminUserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
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
      setMessage({ type: 'error', text: 'Failed to load user details' });
      setTimeout(() => navigate('/admin/users'), 3000);
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
    setMessage({ type: '', text: '' });
    try {
      await api.put(`/api/admin/users/${id}`, formData);
      setMessage({ type: 'success', text: 'User updated successfully' });
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err) {
      console.error('Update failed:', err);
      const errorMsg = err.response?.data?.detail;
      setMessage({ 
        type: 'error', 
        text: Array.isArray(errorMsg) ? 'Validation error occurred' : (errorMsg || 'Failed to update user') 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Activity className="hero-sway" size={48} color="var(--primary)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Loading user details...</p>
      </div>
    );
  }

  return (
    <div className="admin-edit-user-page" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      {/* Premium Hero Header */}
      <div className="page-hero page-hero--row">
        {/* Premium Decorative Background Icons */}
        <Users size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '10%', left: '5%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <Shield size={68} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '45%', left: '3%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <Lock size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '14%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <ShieldCheck size={80} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '10%', right: '8%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        <Settings size={64} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '55%', right: '4%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <Briefcase size={66} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '12%', right: '16%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <Layers size={74} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '30%', right: '24%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <Activity size={54} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '38%', left: '28%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <div className="ms-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
             <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '16px' }}>
                <User size={32} color="#ecfdf5" />
             </div>
             <h1 className="premium-gradient-text" style={{ fontSize: '2.5rem', fontWeight: '900' }}>Edit User</h1>
          </div>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>Managing account: <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{user?.email}</span></p>
        </div>

        <button className="btn-secondary" onClick={() => navigate('/admin/users')} style={{ width: 'auto', padding: '0.8rem 1.5rem', borderRadius: '14px', display: 'flex', gap: '0.5rem' }}>
          <ArrowLeft size={18} /> Back to Users
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>
        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '1.25rem', 
            borderRadius: '16px', 
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)',
            animation: 'slideDown 0.3s ease',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: message.type === 'success' ? '#065f46' : '#991b1b'
          }}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: '600' }}>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Account Settings Card */}
          <div className="card" style={{ padding: '2.5rem', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
              <Shield size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Account Settings</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={14} /> Full Name
                </label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="User's full name"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={14} /> User Role
                </label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="USER">Standard User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  background: 'rgba(var(--primary-rgb), 0.05)',
                  borderRadius: '16px',
                  border: '1px solid var(--card-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '10px', 
                      background: formData.is_active ? 'var(--primary)' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'all 0.3s ease'
                    }}>
                      <Activity size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '700' }}>Account Status</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formData.is_active ? 'This account is currently active and can log in.' : 'This account is disabled and cannot access the system.'}
                      </p>
                    </div>
                  </div>
                  <label className="switch" style={{ margin: 0, position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                    <input 
                      type="checkbox" 
                      name="is_active" 
                      checked={formData.is_active} 
                      onChange={handleCheckboxChange}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span className="slider round" style={{ 
                      position: 'absolute', 
                      cursor: 'pointer', 
                      top: 0, left: 0, right: 0, bottom: 0, 
                      backgroundColor: formData.is_active ? 'var(--primary)' : '#ccc',
                      transition: '.4s',
                      borderRadius: '34px'
                    }}>
                      <span style={{ 
                        position: 'absolute', 
                        height: '26px', width: '26px', 
                        left: formData.is_active ? '30px' : '4px', bottom: '4px', 
                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%' 
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* User Preferences Card */}
          <div className="card" style={{ padding: '2.5rem', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
              <Layers size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>User Preferences</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Diet Type</label>
                <select name="pref_dietType" value={formData.preferences.dietType} onChange={handleChange}>
                  <option value="">No specific diet</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Pescatarian">Pescatarian</option>
                  <option value="Keto">Keto</option>
                  <option value="Paleo">Paleo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Budget Level</label>
                <select name="pref_budgetLevel" value={formData.preferences.budgetLevel} onChange={handleChange}>
                  <option value="">Not Specified</option>
                  <option value="Low">Low Budget</option>
                  <option value="Medium">Medium Budget</option>
                  <option value="High">Premium Budget</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={14} /> Household
                </label>
                <input 
                  type="number" 
                  name="pref_householdSize" 
                  value={formData.preferences.householdSize} 
                  onChange={handleChange} 
                  min="1"
                  max="20"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="submit" 
              disabled={saving} 
              className="btn-primary" 
              style={{ 
                width: 'auto', 
                padding: '1rem 3rem', 
                borderRadius: '16px', 
                display: 'flex', 
                gap: '0.75rem',
                fontSize: '1.1rem',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              {saving ? (
                <>
                  <Activity className="hero-sway" size={20} /> Saving...
                </>
              ) : (
                <>
                  <Save size={20} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminUserEdit;
