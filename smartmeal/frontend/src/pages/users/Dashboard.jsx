import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <button 
          onClick={toggleTheme} 
          style={{ width: 'auto', margin: 0, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      
      <p>Welcome to your SmartRecipe dashboard, {user ? user.name : 'User'}!</p>
      
      
    </div>
  );
}

export default Dashboard;
