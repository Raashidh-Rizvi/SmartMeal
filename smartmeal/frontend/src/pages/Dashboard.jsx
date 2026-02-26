import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="dashboard-content">
      <h2>Dashboard</h2>
      <p>Welcome to your SmartRecipe dashboard, {user ? user.name : 'User'}!</p>
      
      <nav style={{ marginTop: '2rem' }}>
        <ul>
          <li><Link to="/profile">My Profile</Link></li>
        </ul>
      </nav>

      <button onClick={logout} style={{ marginTop: '2rem' }}>Log Out</button>
    </div>
  );
}

export default Dashboard;
