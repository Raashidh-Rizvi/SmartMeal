import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api/axios';
import { validatePassword, getPasswordStrength } from '../../utils/passwordValidation';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If redirected from Forgot Password, pre-fill email
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(newPassword, { email });
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setLoading(true);
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const response = await api.post('/api/auth/reset-password', { 
        email: normalizedEmail, 
        otp, 
        newPassword 
      });
      setMessage(response.data.message);
      // Wait then navigate to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP or expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glassmorphic">
        <h2>Reset Password</h2>
        <p className="auth-subtitle">Enter the OTP sent to your email and choose a new password.</p>
        
        {message && <div className="alert alert-success">{message} Redirecting to login...</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value.toLowerCase())} 
              placeholder="name@example.com"
              required 
              disabled={loading || !!location.state?.email}
            />
          </div>

          <div className="form-group">
            <label>OTP Code</label>
            <input 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              required 
              disabled={loading}
              className="otp-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Min. 12 characters, mixed types"
              required 
              disabled={loading}
            />
            <div className="password-strength-container" style={{ marginTop: '0.5rem' }}>
              <div 
                className="password-strength-bar" 
                style={{ 
                  height: '4px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{ 
                    width: `${getPasswordStrength(newPassword)}%`, 
                    height: '100%', 
                    backgroundColor: getPasswordStrength(newPassword) < 60 ? '#ef4444' : getPasswordStrength(newPassword) < 100 ? '#f59e0b' : '#10b981',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Strength: {getPasswordStrength(newPassword) < 60 ? 'Weak' : getPasswordStrength(newPassword) < 100 ? 'Medium' : 'Strong'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Repeat password"
              required 
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Didn't receive an OTP? <Link to="/forgot-password">Request again</Link>
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 160px);
          padding: 2rem;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }
        .auth-card {
          width: 100%;
          max-width: 450px;
          padding: 2.5rem;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.1);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .auth-subtitle {
          color: #6b7280;
          text-align: center;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }
        h2 {
          color: #064e3b;
          text-align: center;
          margin-bottom: 0.5rem;
          font-weight: 700;
          font-size: 1.75rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
          font-size: 0.9rem;
        }
        input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          transition: all 0.3s ease;
          outline: none;
        }
        input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .otp-input {
          text-align: center;
          letter-spacing: 0.5rem;
          font-weight: 700;
          font-size: 1.2rem;
        }
        .btn-primary {
          width: 100%;
          padding: 0.75rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.3s ease;
        }
        .btn-primary:hover {
          background: #059669;
          transform: translateY(-2px);
        }
        .btn-primary:active {
          transform: translateY(0);
        }
        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .alert {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          text-align: center;
        }
        .alert-success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #c4f1e1;
        }
        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fee2e2;
        }
        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9rem;
          color: #6b7280;
        }
        .auth-footer a {
          color: #10b981;
          text-decoration: none;
          font-weight: 600;
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }
      `}} />
    </div>
  );
}

export default ResetPassword;
