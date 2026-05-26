import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
<<<<<<< HEAD
=======
import { Trash2, UtensilsCrossed, ChefHat, Flame, Leaf } from 'lucide-react';
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

function DeleteAccount() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    setLoading(true);
    setError('');

    try {
      await api.delete('/api/users/me');
      // On success, force logout and navigate
      logout();
      navigate('/register');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="auth-container card" style={{ borderColor: 'var(--danger)' }}>
      <h2 className="text-danger">Delete Account</h2>
      
      <div className="alert alert-error">
        <strong>Warning:</strong> This action is permanent and cannot be undone. All your recipes, preferences, and data will be permanently deleted.
      </div>
      
      {error && <p className="error alert-error">{error}</p>}
      
      <div className="form-group" style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input 
          type="checkbox" 
          id="confirmDelete"
          checked={confirmDelete}
          onChange={(e) => setConfirmDelete(e.target.checked)}
          style={{ width: 'auto' }}
        />
        <label htmlFor="confirmDelete" style={{ margin: 0, cursor: 'pointer' }}>
          I understand the consequences and want to delete my account.
        </label>
      </div>
      
      <div className="form-actions">
        <button 
          onClick={handleDelete} 
          disabled={!confirmDelete || loading} 
          className="btn-danger"
          style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', border: 'none', borderRadius: '4px', cursor: confirmDelete ? 'pointer' : 'not-allowed', backgroundColor: confirmDelete ? 'var(--danger)' : 'var(--muted)', color: 'white', fontSize: '1rem' }}
        >
          {loading ? 'Deleting...' : 'Permanently Delete Account'}
        </button>
        <button 
          type="button" 
          onClick={() => navigate('/profile')} 
          className="btn-secondary"
          style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--text)', fontSize: '1rem' }}
        >
          Cancel
        </button>
=======
    <div className="profile-page-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Premium Hero Header */}
      <div className="page-hero">
        {/* Decorative Background Icons - Scattered */}
        <UtensilsCrossed size={48} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '180px', left: '8%', '--rotation': '-18deg' }} />
        <ChefHat size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '220px', left: '42%', '--rotation': '12deg', animationDelay: '0.8s' }} />
        <Flame size={44} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '25%', '--rotation': '22deg', animationDelay: '1.5s' }} />
        <Leaf size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '190px', right: '12%', '--rotation': '-8deg', animationDelay: '2.3s' }} />

        <Trash2 size={48} color="#ef4444" style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#ecfdf5' }}>Delete Account</h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', color: '#fecaca' }}>This action is permanent and cannot be undone.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '2rem', marginTop: '-4rem', position: 'relative', zIndex: 10 }}>
        <div className="auth-container card" style={{ width: '100%', maxWidth: '500px', padding: '3rem', borderRadius: '32px', boxShadow: 'var(--shadow-premium)', background: 'var(--card-bg)', backdropFilter: 'var(--glass-blur)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="alert alert-error">
            <strong>Warning:</strong> This action is permanent and cannot be undone. All your recipes, preferences, and data will be permanently deleted.
          </div>
          
          {error && <p className="error alert-error">{error}</p>}
          
          <div className="form-group" style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="confirmDelete"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <label htmlFor="confirmDelete" style={{ margin: 0, cursor: 'pointer' }}>
              I understand the consequences and want to delete my account.
            </label>
          </div>
          
          <div className="form-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={handleDelete} 
              disabled={!confirmDelete || loading} 
              className="btn btn-danger"
              style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontWeight: '700' }}
            >
              {loading ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/profile')} 
              className="btn btn-secondary"
              style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontWeight: '700' }}
            >
              Cancel
            </button>
          </div>
        </div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
      </div>
    </div>
  );
}

export default DeleteAccount;
