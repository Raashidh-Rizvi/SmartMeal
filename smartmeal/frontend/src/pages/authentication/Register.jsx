import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { validatePassword } from '../../utils/passwordValidation';
import PasswordInput from '../../components/PasswordInput';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useContext(AuthContext);

  const handleGoogleLogin = async () => {
    try {
      setErrors({});
      await loginWithGoogle();
      navigate('/dashboard');
    } catch {
      setErrors({ general: 'Google Sign-In failed. Please try again.' });
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};
    if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!validateEmail(email)) newErrors.email = 'Invalid email format';

    const passwordErrors = validatePassword(password, { name, email });
    if (passwordErrors.length > 0) newErrors.password = passwordErrors[0];

    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const normalizedEmail = email.toLowerCase().trim();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', { name, email: normalizedEmail, password });
      login(data.user, data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.detail;
      if (Array.isArray(errMsg)) {
        const backendErrors = {};
        errMsg.forEach(e => { backendErrors[e.loc[1]] = e.msg; });
        setErrors(backendErrors);
      } else {
        setErrors({ general: errMsg || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-gradient)' }}>
      <div className="auth-brand" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <UtensilsCrossed size={32} color="var(--primary)" strokeWidth={2.5} />
          <span style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>Smart Recipe</span>
        </div>
      </div>

      <div className="auth-container" style={{ width: '100%', maxWidth: '520px', padding: '3rem', borderRadius: '32px', boxShadow: 'var(--shadow-premium)', background: 'var(--card-bg)', backdropFilter: 'var(--glass-blur)' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent', textAlign: 'center', letterSpacing: '-0.03em', display: 'inline-block', width: '100%' }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '1.05rem' }}>Join our community of food lovers</p>
        
        {errors.general && <p className="error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{errors.general}</p>}
        
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>👤</span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
                placeholder="John Doe"
                style={{ paddingLeft: '3.25rem' }}
                required
              />
            </div>
            {errors.name && <span className="error-text" style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>📧</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.toLowerCase());
                  if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                }}
                placeholder="you@example.com"
                style={{ paddingLeft: '3.25rem' }}
                required
              />
            </div>
            {errors.email && <span className="error-text" style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
          </div>

          {/* Password */}
          <PasswordInput
            id="register-password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: null }));
            }}
            placeholder="Min. 12 chars, mixed types"
            error={errors.password}
            showStrength
          />

          {/* Confirm Password */}
          <PasswordInput
            id="register-confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
            }}
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            showMatch
            matchValue={password}
          />

          <button type="submit" className="btn-primary" disabled={loading} style={{ height: '3.5rem', fontSize: '1.1rem', marginTop: '1rem' }}>
            {loading ? 'Creating account…' : 'Create Account'} <span style={{ marginLeft: '0.5rem' }}>→</span>
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Or join with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin} 
          className="btn-secondary" 
          style={{ height: '3.5rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '12px', borderRadius: '16px', fontWeight: '600', fontSize: '1rem' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <p style={{ marginTop: '2.5rem', fontSize: '1rem' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: '700' }}>Log in here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
