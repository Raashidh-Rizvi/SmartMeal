import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
<<<<<<< HEAD
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
=======
import { UtensilsCrossed, Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import PasswordInput from '../../components/PasswordInput';
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setError('');
<<<<<<< HEAD
      await loginWithGoogle();
      navigate('/dashboard');
=======
      const data = await loginWithGoogle();
      if (data?.user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    } catch {
      setError('Google Sign-In failed. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
<<<<<<< HEAD
    try {
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2 expects 'username' field
      formData.append('password', password);

      const response = await api.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const { accessToken, user } = response.data;
      
      login(user, accessToken);
      navigate('/profile');
=======
    const normalizedEmail = email.toLowerCase().trim();
    try {
      // Use URLSearchParams for application/x-www-form-urlencoded (OAuth2 requirement)
      const params = new URLSearchParams();
      params.append('username', normalizedEmail);
      params.append('password', password);
      
      const response = await api.post('/api/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      
      const { accessToken, user } = response.data;
      login(user, accessToken);
      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    }
  };

  return (
<<<<<<< HEAD
    <div className="auth-container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      
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
        Sign in with Google
      </button>

      <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-muted)' }}>
        <span>OR</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="you@example.com"
            required 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter your password"
            required 
          />
        </div>
        <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Log In</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
=======
    <div className="auth-page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-gradient)' }}>
      <div className="auth-brand" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <UtensilsCrossed size={32} color="var(--primary)" strokeWidth={2.5} />
          <span style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>Smart Recipe</span>
        </div>
      </div>

      <div className="auth-container" style={{ width: '100%', maxWidth: '480px', padding: '3rem', borderRadius: '32px', boxShadow: 'var(--shadow-premium)', background: 'var(--card-bg)', backdropFilter: 'var(--glass-blur)' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent', textAlign: 'center', letterSpacing: '-0.03em', display: 'inline-block', width: '100%' }}>Welcome back</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Sign in to access your account</p>
        
        {error && <p className="error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--text-main)' }}>
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value.toLowerCase())} 
                placeholder="johnanne@mail.com"
                style={{ paddingLeft: '3.25rem' }}
                required 
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <PasswordInput
              id="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              prefixIcon={Lock}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: 0, textTransform: 'none', letterSpacing: 'normal', fontSize: '0.9rem' }}>
              <input type="checkbox" style={{ width: '18px', height: '18px', margin: 0 }} />
              Remember Me
            </label>
            <Link to="/forgot-password" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Forgot Password?</Link>
          </div>

          <button type="submit" className="btn-primary" style={{ height: '3.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Login <ArrowRight size={20} />
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Or continue with</span>
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
          Don't have an account? <Link to="/register" style={{ fontWeight: '700' }}>Register here</Link>
        </p>
      </div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    </div>
  );
}

export default Login;
