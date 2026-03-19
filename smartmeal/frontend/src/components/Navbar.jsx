import React, { useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
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

        {/* Hamburger Toggle (Mobile) */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          style={{ display: menuOpen ? 'none' : '' }}
        >
          <div className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* Nav Menu */}
        <div className={`navbar-menu ${menuOpen ? 'navbar-menu--open' : ''}`}>
          {user ? (
            <>
              <Link to="/inventory" className={`navbar-link${location.pathname === '/inventory' ? ' active' : ''}`} onClick={closeMenu}>Inventory</Link>
              <Link to="/recommendations" className={`navbar-link${location.pathname === '/recommendations' ? ' active' : ''}`} onClick={closeMenu}>Recommendations</Link>
              <Link to="/meals" className={`navbar-link${location.pathname === '/meals' ? ' active' : ''}`} onClick={closeMenu}>Meal Schedule</Link>
              <Link to="/shoppinglist" className={`navbar-link${location.pathname === '/shoppinglist' ? ' active' : ''}`} onClick={closeMenu}>Shopping List</Link>
              <Link to="/recipes" className={`navbar-link${location.pathname === '/recipes' ? ' active' : ''}`} onClick={closeMenu}>Recipes</Link>

              {user.role === 'ADMIN' && (
                <Link to="/admin" className={`navbar-link${location.pathname === '/admin' ? ' active' : ''}`} onClick={closeMenu}>Admin</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className={`navbar-link${location.pathname === '/login' ? ' active' : ''}`} onClick={closeMenu}>Login</Link>
              <Link to="/register" className="navbar-link" onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>

        {/* User Actions */}
        <div className="navbar-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {user && (
            <>
              <Link to="/profile" className="navbar-user-pill" onClick={closeMenu}>
                <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                <span className="navbar-user-name">{user.name}</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
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
