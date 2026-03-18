import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

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
      </div>
    </div>
  );
}

export default DeleteAccount;
