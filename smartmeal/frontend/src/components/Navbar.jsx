import React, { useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to={user ? "/dashboard" : "/login"} onClick={closeMenu}>Smart Meal</Link>
        </div>

        {/* Hamburger Toggle */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className={`hamburger-icon ${menuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Nav Menu */}
        <div className={`navbar-menu ${menuOpen ? 'navbar-menu--open' : ''}`}>
          {user ? (
            <>
              <Link to="/inventory" className="navbar-link" onClick={closeMenu}>Inventory</Link>
              <Link to="/recommendations" className="navbar-link" onClick={closeMenu}>Recommendations</Link>
              <Link to="/mealplan" className="navbar-link" onClick={closeMenu}>Meal Plan</Link>
              <Link to="/shoppinglist" className="navbar-link" onClick={closeMenu}>Shopping List</Link>

              {user.role === 'ADMIN' && (
                <Link to="/admin" className="navbar-link" style={{ color: 'var(--primary)', fontWeight: 'bold' }} onClick={closeMenu}>Admin</Link>
              )}

              <Link to="/profile" className="navbar-link" onClick={closeMenu}>
                <span className="navbar-user">👤 {user.name}</span>
              </Link>
              <button onClick={handleLogout} className="btn-secondary btn-small">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="btn-primary btn-small" onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Overlay rendered at body level via portal to avoid stacking context issues */}
      {menuOpen && ReactDOM.createPortal(
        <div className="navbar-overlay" onClick={closeMenu} />,
        document.body
      )}
    </>
  );
}

export default Navbar;
