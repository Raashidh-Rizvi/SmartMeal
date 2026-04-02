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
  const userDropdownRef = useRef(null);
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
        {/* Top Row: Brand, Primary Links & User Actions */}
        <div className="navbar-row navbar-top-row">
          <div className="navbar-brand">
            <Link to={user ? "/dashboard" : "/login"} onClick={closeMenu}>
              <span className="brand-text">Smart Meal</span>
            </Link>
          </div>

          <div className={`navbar-menu ${menuOpen ? 'navbar-menu--open' : ''}`}>
            {user && (
              <>
                <Link to="/recommendations" className={`navbar-link${location.pathname === '/recommendations' ? ' active' : ''}`} onClick={closeMenu} title="Recipe Recommendations Based on Your Stock">
                  <span className="nav-icon">💡</span> Recommendations
                </Link>
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
                
                {/* Mobile-only visible planning links */}
                <div className="mobile-planning-links">
                  <div className="dropdown-divider"></div>
                  <Link to="/meals" className={`navbar-link${location.pathname === '/meals' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon">📅</span> Meal Schedule
                  </Link>
                  <Link to="/inventory" className={`navbar-link${location.pathname === '/inventory' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon">📦</span> Ingredients
                  </Link>
                  <Link to="/shoppinglist" className={`navbar-link${location.pathname === '/shoppinglist' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon">🛒</span> Shopping List
                  </Link>
                  <Link to="/leftovers" className={`navbar-link${location.pathname === '/leftovers' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon">🍱</span> Leftovers
                  </Link>
                </div>
              </>
            )}
            
            {!user && (
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

          {/* User Actions */}
          <div className="navbar-actions">
            {user ? (
              <div className="navbar-utility-btns">
                <button
                  type="button"
                  className="notification-btn"
                  title="View notifications"
                  onClick={() => setShowNotificationsModal(true)}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-bell">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
                </button>
                
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
            ) : (
              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            )}

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
          </div>
        </div>

        {/* Bottom Row: Planning Links (Only for authed users) */}
        {user && (
          <div className="navbar-row navbar-bottom-row">
            <div className="navbar-planning-links">
              <Link to="/meals" className={`navbar-link${location.pathname === '/meals' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon">📅</span> Meal Schedule
              </Link>
              <Link to="/inventory" className={`navbar-link${location.pathname === '/inventory' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon">📦</span> Ingredients
              </Link>
              <Link to="/shoppinglist" className={`navbar-link${location.pathname === '/shoppinglist' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon">🛒</span> Shopping List
              </Link>
              <Link to="/leftovers" className={`navbar-link${location.pathname === '/leftovers' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon">🍱</span> Leftovers
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Overlay rendered at body level via portal for mobile menu */}
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
