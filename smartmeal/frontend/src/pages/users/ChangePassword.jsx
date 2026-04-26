import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, RefreshCcw, Key, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import { validatePassword } from '../../utils/passwordValidation';
import PasswordInput from '../../components/PasswordInput';
import { AuthContext } from '../../context/AuthContext';

function ChangePassword() {
  const [method, setMethod] = useState('password'); // 'password' or 'otp'
  const [oldPassword, setOldPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email: user.email });
      setOtpSent(true);
      setSuccess('OTP has been sent to your email!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { setError('Please enter the OTP code'); return; }
    setVerifyingOtp(true);
    setError('');
    try {
      await api.post('/api/auth/verify-otp', { email: user.email, otp });
      setIsVerified(true);
      setSuccess('OTP verified successfully! You can now set your new password.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side policy
    const policies = validatePassword(newPassword, { name: user?.name, email: user?.email });
    if (policies.length > 0) { setError(policies[0]); return; }

    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    
    if (method === 'password' && !oldPassword) {
      setError('Please enter your current password');
      return;
    }
    
    if (method === 'otp' && !isVerified) {
      setError('Please verify your OTP code first');
      return;
    }

    setLoading(true);
    try {
      const payload = { newPassword };
      if (method === 'password') payload.oldPassword = oldPassword;
      else payload.otp = otp;

      await api.put('/api/users/me/password', payload);
      setSuccess('Password updated successfully! Redirecting to profile...');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-gradient)' }}>
      <div className="auth-container card" style={{ width: '100%', maxWidth: '500px', padding: '3rem', borderRadius: '32px', boxShadow: 'var(--shadow-premium)', background: 'var(--card-bg)', backdropFilter: 'var(--glass-blur)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem', color: 'var(--text-main)', textAlign: 'center', letterSpacing: '-0.03em' }}>Change Password</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1rem' }}>
          Choose how you'd like to verify your identity to set a new password.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            {success}
          </div>
        )}

        {/* Method Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-muted)', padding: '0.4rem', borderRadius: '16px', marginBottom: '2.5rem' }}>
          <button 
            type="button" 
            onClick={() => { setMethod('password'); setIsVerified(false); }}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: method === 'password' ? 'var(--card-bg)' : 'transparent', color: method === 'password' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: method === 'password' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}
          >
            Password
          </button>
          <button 
            type="button" 
            onClick={() => setMethod('otp')}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: method === 'otp' ? 'var(--card-bg)' : 'transparent', color: method === 'otp' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: method === 'otp' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}
          >
            Email OTP
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {method === 'password' ? (
            <div className="form-group">
              <PasswordInput
                id="oldPassword"
                label="Current Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                prefixIcon={Lock}
                required
              />
              <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setMethod('otp'); setIsVerified(false); setOtp(''); }}
                  className="premium-link-btn"
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--primary)', 
                    fontSize: '0.85rem', 
                    fontWeight: '700', 
                    cursor: 'pointer', 
                    padding: '0.25rem 0',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.01em'
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>OTP Code</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input 
                    type="text" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                    placeholder="000000"
                    maxLength="6"
                    disabled={isVerified}
                    style={{ 
                      paddingLeft: '3.25rem', 
                      height: '3.5rem', 
                      borderRadius: '16px',
                      letterSpacing: '0.3em',
                      fontWeight: '800',
                      fontSize: '1.2rem'
                    }}
                  />
                </div>
                {!isVerified ? (
                  <button 
                    type="button" 
                    onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                    disabled={sendingOtp || verifyingOtp}
                    className="btn-primary"
                    style={{ width: 'auto', padding: '0 1.5rem', height: '3.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {sendingOtp || verifyingOtp ? '...' : otpSent ? 'Verify' : 'Send'}
                    <RefreshCcw size={16} className={sendingOtp || verifyingOtp ? 'spinning' : ''} />
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: '700', padding: '0 1rem' }}>
                    <ShieldCheck size={20} />
                    Verified
                  </div>
                )}
              </div>
              {!isVerified && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {otpSent ? 'Enter the code sent to your email.' : `We'll send a code to ${user.email.replace(/(.{3}).*(@.*)/, "$1***$2")}`}
                </p>
              )}
            </div>
          )}

          {(method === 'password' || isVerified) && (
            <>
              <div style={{ height: '1px', background: 'var(--card-border)', margin: '0.5rem 0' }}></div>

              <div className="form-group">
                <PasswordInput
                  id="newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 12 characters"
                  prefixIcon={ShieldCheck}
                  showStrength
                  required
                />
              </div>

              <div className="form-group">
                <PasswordInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  prefixIcon={Key}
                  showMatch
                  matchValue={newPassword}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => navigate('/profile')} 
                  className="btn-secondary"
                  style={{ flex: 1, height: '3.5rem', borderRadius: '16px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !!success} 
                  className="btn-primary"
                  style={{ flex: 2, height: '3.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {loading ? 'Updating...' : (
                    <>
                      <Key size={20} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
