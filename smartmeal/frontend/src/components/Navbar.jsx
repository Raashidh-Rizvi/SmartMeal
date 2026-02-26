import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={user ? "/dashboard" : "/login"}>SmartMeal</Link>
      </div>
      <div className="navbar-menu">
        {user ? (
          <>
            <Link to="/inventory" className="navbar-link">Inventory</Link>
            <Link to="/recommendations" className="navbar-link">Recommendations</Link>
            <Link to="/mealplan" className="navbar-link">Meal Plan</Link>
            <Link to="/shoppinglist" className="navbar-link">Shopping List</Link>
            
            <Link to="/profile" className="navbar-link" style={{ marginLeft: '1rem' }}>
              <span className="navbar-user">👤 {user.name}</span>
            </Link>
            <button onClick={handleLogout} className="btn-secondary btn-small">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="btn-primary btn-small">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
