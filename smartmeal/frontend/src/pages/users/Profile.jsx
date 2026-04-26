import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Check, 
  PartyPopper, 
  User, 
  Heart, 
  Users, 
  ShieldCheck, 
  Mail, 
  Settings, 
  Save,
  Lock,
  Trash2,
  ChefHat,
  UtensilsCrossed,
  Flame,
  Leaf
} from 'lucide-react';

function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const isNewUser = searchParams.get('welcome') === '1';

  const [formData, setFormData] = useState({
    name: '',
    dietType: '',
    allergies: '',
    cuisinePreferences: '',
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
        email: user.email,
        preferences: {
          dietType: formData.dietType,
          allergies: formData.allergies.split(',').map(i => i.trim()).filter(i => i),
          cuisinePreferences: formData.cuisinePreferences.split(',').map(i => i.trim()).filter(i => i),
          householdSize: parseInt(formData.householdSize, 10) || 1
        }
      };

      const response = await api.put('/api/users/me', updatePayload);
      setUser(response.data.user);
      setMessage({ type: 'success', text: isNewUser ? 'Preferences saved! You\'re all set.' : 'Profile updated successfully!' });

      // Remove the welcome flag from the URL once they save
      if (isNewUser) {
        setSearchParams({});
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-page-wrapper">
      {/* Premium Hero Header */}
      <div className="page-hero">
        {/* Decorative Background Icons - Scattered */}
        <UtensilsCrossed size={48} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '180px', left: '8%', '--rotation': '-18deg' }} />
        <ChefHat size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '220px', left: '42%', '--rotation': '12deg', animationDelay: '0.8s' }} />
        <Flame size={44} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '25%', '--rotation': '22deg', animationDelay: '1.5s' }} />
        <Leaf size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '190px', right: '12%', '--rotation': '-8deg', animationDelay: '2.3s' }} />

        <User size={48} color="#10b981" style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#ecfdf5' }}>
            {isNewUser ? 'Complete Your Profile' : 'Profile Settings'}
          </h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', color: '#a7f3d0' }}>
            {isNewUser ? 'Just a few details to personalize your experience' : 'Manage your personal information and culinary preferences'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Welcome / Onboarding Banner */}
        {isNewUser && (
          <div className="onboarding-banner" style={{ 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.05) 100%)', 
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '2rem', 
            borderRadius: '24px', 
            marginBottom: '2rem',
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div className="onboarding-banner__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '18px' }}>
              <PartyPopper size={40} color="var(--primary)" />
            </div>
            <div className="onboarding-banner__body">
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Welcome to Smart Recipe, {user.name}!</h3>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.9, lineHeight: '1.5', color: 'var(--text-muted)' }}>
                To get personalised recipe recommendations, please fill in your dietary preferences below.
                This helps us suggest meals you'll love.
              </p>
            </div>
          </div>
        )}

        {message.text && (
        <div className={`alert alert-${message.type}`} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
          animation: 'slideDown 0.3s ease'
        }}>
          {message.type === 'success' ? <ShieldCheck size={20} /> : <Settings size={20} />}
          <span style={{ fontWeight: '600' }}>{message.text}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="profile-form" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section: Account Information */}
        <div className="profile-section card" style={{ padding: '2.5rem', borderRadius: '28px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-premium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
            <User size={24} color="var(--primary)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Account Information</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  style={{ paddingLeft: '3rem', borderRadius: '14px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="email" 
                  value={user.email} 
                  disabled 
                  readOnly 
                  style={{ paddingLeft: '3rem', borderRadius: '14px', background: 'var(--bg-muted)', opacity: 0.7 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Dietary Preferences */}
        <div className="profile-section card" style={{ padding: '2.5rem', borderRadius: '28px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-premium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
            <Heart size={24} color="#ef4444" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Dietary Preferences</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Diet Type</label>
              <select name="dietType" value={formData.dietType} onChange={handleChange} style={{ borderRadius: '14px' }}>
                <option value="">No specific diet</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Household Size</label>
              <div style={{ position: 'relative' }}>
                <Users size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="number" 
                  name="householdSize" 
                  value={formData.householdSize} 
                  onChange={handleChange} 
                  min="1"
                  max="20"
                  style={{ paddingLeft: '3rem', borderRadius: '14px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Allergies & Intolerances</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', opacity: 0.4 }} />
                <input 
                  type="text" 
                  name="allergies" 
                  value={formData.allergies} 
                  onChange={handleChange} 
                  placeholder="e.g. peanuts, dairy, gluten"
                  style={{ paddingLeft: '3rem', borderRadius: '14px' }}
                />
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Separate multiple allergies with commas</p>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Cuisine Preferences</label>
              <div style={{ position: 'relative' }}>
                <ChefHat size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', opacity: 0.4 }} />
                <input 
                  type="text" 
                  name="cuisinePreferences" 
                  value={formData.cuisinePreferences} 
                  onChange={handleChange} 
                  placeholder="e.g. Italian, Mexican, Asian"
                  style={{ paddingLeft: '3rem', borderRadius: '14px' }}
                />
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your favorite cuisines help us suggest better recipes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary" 
            style={{ 
              height: '4rem', 
              padding: '0 4rem', 
              fontSize: '1.25rem', 
              fontWeight: '800',
              borderRadius: '20px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              boxShadow: 'var(--shadow-lg)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {loading ? 'Processing...' : (
              <>
                {isNewUser ? <Check size={24} /> : <Save size={24} />}
                {isNewUser ? 'Complete Setup' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Security & Danger Zone */}
      {!isNewUser && (
        <div style={{ marginTop: '4rem', padding: '2rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <Link to="/change-password" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            textDecoration: 'none', 
            color: 'var(--text-main)', 
            fontWeight: '600',
            padding: '0.75rem 1.5rem',
            background: 'var(--bg-muted)',
            borderRadius: '12px',
            transition: 'background 0.2s ease'
          }}>
            <Lock size={18} /> Change Password
          </Link>
          <Link to="/delete-account" className="text-danger" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            textDecoration: 'none', 
            fontWeight: '600',
            padding: '0.75rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.05)',
            borderRadius: '12px',
            transition: 'background 0.2s ease'
          }}>
            <Trash2 size={18} /> Delete Account
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}

export default Profile;
