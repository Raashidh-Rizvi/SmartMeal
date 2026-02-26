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
            <span className="navbar-user">Hi, {user.name}</span>
            <Link to="/profile" className="navbar-link">Profile</Link>
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
