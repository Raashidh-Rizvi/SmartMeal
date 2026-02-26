import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/users/me/password', {
        oldPassword,
        newPassword
      });
      setSuccess("Password updated successfully. You will be redirected to profile...");
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container card">
      <h2>Change Password</h2>
      {error && <p className="error alert-error">{error}</p>}
      {success && <p className="success alert-success">{success}</p>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Current Password</label>
          <input 
            type="password" 
            value={oldPassword} 
            onChange={(e) => setOldPassword(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>New Password</label>
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Confirm New Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={loading || success} className="btn-primary">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          <button type="button" onClick={() => navigate('/profile')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePassword;
