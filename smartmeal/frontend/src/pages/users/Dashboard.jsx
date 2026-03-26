import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Welcome back, {user ? user.name : 'User'} 👋</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Here's what's happening with your meals today.</p>
        </div>
        <button 
          onClick={toggleTheme} 
          className="btn-secondary"
          style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      
      <div className="dashboard-grid">
        <Link to="/inventory" className="dashboard-card">
          <div className="card-icon">🥑</div>
          <h3>Inventory</h3>
          <p>Manage your ingredients</p>
        </Link>
        <Link to="/recommendations" className="dashboard-card">
          <div className="card-icon">✨</div>
          <h3>Recipes</h3>
          <p>Get personalized meals</p>
        </Link>
        <Link to="/meals" className="dashboard-card">
          <div className="card-icon">📅</div>
          <h3>Meal Schedule</h3>
          <p>Organize your week</p>
        </Link>
        <Link to="/shoppinglist" className="dashboard-card">
          <div className="card-icon">🛒</div>
          <h3>Shopping List</h3>
          <p>What you need to buy</p>
        </Link>
        <Link to="/recipes" className="dashboard-card">
          <div className="card-icon">📖</div>
          <h3>Recipe Repository</h3>
          <p>Browse &amp; manage all recipes</p>
        </Link>
        <Link to="/leftovers" className="dashboard-card">
          <div className="card-icon">🍽️</div>
          <h3>Leftovers</h3>
          <p>Track & reduce food waste</p>
        </Link>
        <Link to="/budget" className="dashboard-card">
          <div className="card-icon">💰</div>
          <h3>Budget</h3>
          <p>Manage food spending</p>
        </Link>
        <Link to="/profile" className="dashboard-card">
          <div className="card-icon">👤</div>
          <h3>My Profile</h3>
          <p>View and update your details</p>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
