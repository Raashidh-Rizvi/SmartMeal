import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="auth-container">
      <h2>Create Account</h2>
      {errors.general && <p className="error-message general-error">{errors.general}</p>}

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="btn-secondary"
        style={{ marginBottom: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '10px' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign up with Google
      </button>

      <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-muted)' }}>
        <span>OR</span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: null }));
            }}
            placeholder="Your full name"
            className={errors.name ? 'input-error' : ''}
            required
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value.toLowerCase());
              if (errors.email) setErrors(prev => ({ ...prev, email: null }));
            }}
            placeholder="you@example.com"
            className={errors.email ? 'input-error' : ''}
            required
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        {/* Password — with strength + policy checklist */}
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

        {/* Confirm Password — with match indicator */}
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

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in here</Link>
      </p>
    </div>
  );
}

export default Register;
