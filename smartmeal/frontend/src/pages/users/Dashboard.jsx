import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

function Dashboard() {
  const { user } = useContext(AuthContext);

  return (
    <div className="dashboard-content">
      <h2>Dashboard</h2>
      <p>Welcome back, <strong>{user ? user.name : 'User'}</strong>! 👋</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
        What would you like to do today?
      </p>

      <div className="dashboard-cards">
        <Link to="/recipes" className="dash-card" id="dash-recipes-link">
          <span className="dash-card-icon">📖</span>
          <span className="dash-card-title">Recipe Repository</span>
          <span className="dash-card-desc">Browse &amp; manage all recipes</span>
        </Link>

        <Link to="/my-recipes" className="dash-card" id="dash-my-recipes-link">
          <span className="dash-card-icon">🍳</span>
          <span className="dash-card-title">My Recipes</span>
          <span className="dash-card-desc">Recipes you have created</span>
        </Link>

        <Link to="/profile" className="dash-card" id="dash-profile-link">
          <span className="dash-card-icon">👤</span>
          <span className="dash-card-title">My Profile</span>
          <span className="dash-card-desc">View and update your details</span>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
