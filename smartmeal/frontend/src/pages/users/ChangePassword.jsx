import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { validatePassword } from '../../utils/passwordValidation';
import PasswordInput from '../../components/PasswordInput';
import { AuthContext } from '../../context/AuthContext';

function ChangePassword() {
  const [oldPassword, setOldPassword]         = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side policy
    const policies = validatePassword(newPassword, { name: user?.name, email: user?.email });
    if (policies.length > 0) { setError(policies[0]); return; }

    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    if (oldPassword === newPassword)     { setError('New password must be different from your current password'); return; }

    setLoading(true);
    try {
      await api.put('/api/users/me/password', { oldPassword, newPassword });
      setSuccess('Password updated successfully! Redirecting to profile…');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container card">
      <h2>Change Password</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', marginTop: '-0.75rem' }}>
        Your new password must satisfy all the policy requirements shown below.
      </p>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1.25rem',
          color: 'var(--danger)', fontSize: '0.88rem', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <span>⚠</span> {error}
        </div>
      )}
      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1.25rem',
          color: '#10b981', fontSize: '0.88rem', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <span>✓</span> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Current password — no strength, no checklist */}
        <PasswordInput
          id="cp-current"
          label="Current Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Enter your current password"
        />

        {/* New password — full strength + policy checklist */}
        <PasswordInput
          id="cp-new"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min. 12 chars, mixed types"
          showStrength
        />

        {/* Confirm — match indicator only */}
        <PasswordInput
          id="cp-confirm"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your new password"
          showMatch
          matchValue={newPassword}
        />

        <div className="form-actions">
          <button type="submit" disabled={loading || !!success} className="btn-primary">
            {loading ? 'Updating…' : 'Update Password'}
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
