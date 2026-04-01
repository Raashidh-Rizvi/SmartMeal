import React, { useContext, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import NotificationsModal from './NotificationsModal';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMealDropdown, setShowMealDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  const mealDropdownRef = useRef(null);
  const isAdmin = user?.role?.toString()?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user) {
        setUnreadNotifications(0);
        return;
      }

      try {
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:8001/api/notifications?unread=true', {
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadNotifications(data.length || 0);
        }
      } catch {
        setUnreadNotifications(0);
      }
    };

    loadUnreadCount();
  }, [user]);

  // Click outside dropdowns logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (mealDropdownRef.current && !mealDropdownRef.current.contains(event.target)) {
        setShowMealDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <Link to={user ? "/dashboard" : "/login"} onClick={closeMenu}>
            <span className="brand-text">Smart Meal</span>
          </Link>
        </div>

        {/* Hamburger Toggle (Mobile) */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
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

              <Link to="/recommendations" className={`navbar-link${location.pathname === '/recommendations' ? ' active' : ''}`} onClick={closeMenu} title="Recipe Recommendations Based on Your Stock">
                <span className="nav-icon">💡</span> Recommendations
              </Link>
              
              {/* Meal Planning Dropdown */}
              <div className="navbar-dropdown-container" ref={mealDropdownRef}>
                <button 
                  className={`navbar-dropdown-trigger${(location.pathname === '/meals' || location.pathname === '/inventory' || location.pathname === '/shoppinglist' || location.pathname === '/leftovers') ? ' active' : ''}`}
                  onClick={() => setShowMealDropdown(!showMealDropdown)}
                >
                  <span className="nav-icon">📅</span> Meal Schedule <span className="dropdown-arrow">▾</span>
                </button>
                
                {showMealDropdown && (
                  <div className="navbar-dropdown-menu">
                    <Link to="/meals" className={`dropdown-item${location.pathname === '/meals' ? ' active' : ''}`} onClick={() => { setShowMealDropdown(false); closeMenu(); }}>
                      <span className="dropdown-icon">📅</span> Meal Schedule
                    </Link>
                    <Link to="/inventory" className={`dropdown-item${location.pathname === '/inventory' ? ' active' : ''}`} onClick={() => { setShowMealDropdown(false); closeMenu(); }}>
                      <span className="dropdown-icon">📦</span> Ingredients
                    </Link>
                    <Link to="/shoppinglist" className={`dropdown-item${location.pathname === '/shoppinglist' ? ' active' : ''}`} onClick={() => { setShowMealDropdown(false); closeMenu(); }}>
                      <span className="dropdown-icon">🛒</span> Shopping List
                    </Link>
                    <Link to="/leftovers" className={`dropdown-item${location.pathname === '/leftovers' ? ' active' : ''}`} onClick={() => { setShowMealDropdown(false); closeMenu(); }}>
                      <span className="dropdown-icon">🍱</span> Leftovers
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/recipes" className={`navbar-link${location.pathname === '/recipes' ? ' active' : ''}`} onClick={closeMenu} title="Browse All Recipes">
                <span className="nav-icon">📖</span> Recipes
              </Link>
              <Link to="/budget" className={`navbar-link${location.pathname === '/budget' ? ' active' : ''}`} onClick={closeMenu} title="Monitor Your Grocery Spending">
                <span className="nav-icon">💰</span> Budget
              </Link>

              {isAdmin && (
                <Link to="/admin" className={`navbar-link${location.pathname === '/admin' ? ' active' : ''}`} onClick={closeMenu} title="Admin Dashboard">
                  <span className="nav-icon">🛡️</span> Admin
                </Link>
              )}

              {/* User Section Inside Menu (Mobile) */}

            </>
          ) : (
            <>
              <Link to="/login" className={`navbar-link${location.pathname === '/login' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon">🔑</span> Login
              </Link>
              <Link to="/register" className="navbar-link" onClick={closeMenu}>
                <span className="nav-icon">📝</span> Register
              </Link>
            </>
          )}
        </div>

        {/* User Actions (Desktop/Top-Bar) */}
        <div className="navbar-actions">
          {user && (
            <div className="navbar-utility-btns">
              <button
                type="button"
                className="notification-btn"
                title="View notifications"
                onClick={() => setShowNotificationsModal(true)}
              >
                🔔
                {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
              </button>
              
              {/* User Dropdown Trigger */}
              <div className="user-dropdown-container" ref={userDropdownRef}>
                <button 
                  className="user-profile-trigger icon-only" 
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  aria-label="User Account Menu"
                  title={user.name}
                >
                  <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                </button>

                {showUserDropdown && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <p className="dropdown-user-name">{user.name}</p>
                      <p className="dropdown-user-email">{user.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                      <span className="dropdown-icon">👤</span> Profile
                    </Link>
                    
                    <button className="dropdown-item appearance-toggle" onClick={() => { toggleTheme(); setShowUserDropdown(false); }}>
                      <span className="dropdown-icon">{isDark ? '☀️' : '🌙'}</span> 
                      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    
                    {isAdmin && (
                      <Link to="/admin" className={`dropdown-item${location.pathname === '/admin' ? ' active' : ''}`} onClick={() => setShowUserDropdown(false)}>
                        <span className="dropdown-icon">🛡️</span> Admin Panel
                      </Link>
                    )}
                    
                    <div className="dropdown-divider"></div>
                    
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <span className="dropdown-icon">🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!user && (
             <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
          )}
        </div>
      </nav>

      {/* Overlay rendered at body level via portal to avoid stacking context issues */}
      {menuOpen && ReactDOM.createPortal(
        <div className="navbar-overlay" onClick={closeMenu} />,
        document.body
      )}

      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={showNotificationsModal} 
        onClose={() => setShowNotificationsModal(false)} 
        onUnreadCountChange={setUnreadNotifications}
      />
    </>
  );
}

export default Navbar;
