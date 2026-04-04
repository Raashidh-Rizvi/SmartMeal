import React, { useContext, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import NotificationsModal from './NotificationsModal';
import { 
  Lightbulb, 
  BookOpen, 
  Wallet, 
  ShieldCheck, 
  Calendar, 
  Package, 
  ShoppingCart, 
  ChefHat, 
  LogIn, 
  UserPlus, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  Bell,
  UtensilsCrossed
} from 'lucide-react';

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
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8001/api/notifications?unread=true', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    // Re-check every 5 minutes while app is open
    const interval = setInterval(loadUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
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
            <Link to={user ? "/dashboard" : "/login"} onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UtensilsCrossed size={24} color="var(--primary)" />
              <span className="brand-text">Smart Meal</span>
            </Link>
          </div>

          <div className={`navbar-menu ${menuOpen ? 'navbar-menu--open' : ''}`}>
            {user && (
              <>
                <Link to="/recommendations" className={`navbar-link${location.pathname === '/recommendations' ? ' active' : ''}`} onClick={closeMenu} title="Recipe Recommendations Based on Your Stock">
                  <span className="nav-icon"><Lightbulb size={18} /></span> Recommendations
                </Link>
                <Link to="/recipes" className={`navbar-link${location.pathname === '/recipes' ? ' active' : ''}`} onClick={closeMenu} title="Browse All Recipes">
                  <span className="nav-icon"><BookOpen size={18} /></span> Recipes
                </Link>
                <Link to="/budget" className={`navbar-link${location.pathname === '/budget' ? ' active' : ''}`} onClick={closeMenu} title="Monitor Your Grocery Spending">
                  <span className="nav-icon"><Wallet size={18} /></span> Budget
                </Link>
                {isAdmin && (
                  <Link to="/admin" className={`navbar-link${location.pathname === '/admin' ? ' active' : ''}`} onClick={closeMenu} title="Admin Dashboard">
                    <span className="nav-icon"><ShieldCheck size={18} /></span> Admin
                  </Link>
                )}
                
                {/* Mobile-only visible planning links */}
                <div className="mobile-planning-links">
                  <div className="dropdown-divider"></div>
                  <Link to="/meals" className={`navbar-link${location.pathname === '/meals' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon"><Calendar size={18} /></span> Meal Schedule
                  </Link>
                  <Link to="/inventory" className={`navbar-link${location.pathname === '/inventory' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon"><Package size={18} /></span> Ingredients
                  </Link>
                  <Link to="/shoppinglist" className={`navbar-link${location.pathname === '/shoppinglist' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon"><ShoppingCart size={18} /></span> Shopping List
                  </Link>
                  <Link to="/leftovers" className={`navbar-link${location.pathname === '/leftovers' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon"><ChefHat size={18} /></span> Leftovers
                  </Link>
                </div>
              </>
            )}
            
            {!user && (
              <>
                <Link to="/login" className={`navbar-link${location.pathname === '/login' ? ' active' : ''}`} onClick={closeMenu}>
                  <span className="nav-icon"><LogIn size={18} /></span> Login
                </Link>
                <Link to="/register" className="navbar-link" onClick={closeMenu}>
                  <span className="nav-icon"><UserPlus size={18} /></span> Register
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
                  <Bell size={22} className="lucide-bell" />
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
                        <span className="dropdown-icon"><User size={18} /></span> Profile
                      </Link>
                      
                      <button className="dropdown-item appearance-toggle" onClick={() => { toggleTheme(); setShowUserDropdown(false); }}>
                        <span className="dropdown-icon">{isDark ? <Sun size={18} /> : <Moon size={18} />}</span> 
                        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                      </button>
                      
                      {isAdmin && (
                        <Link to="/admin" className={`dropdown-item${location.pathname === '/admin' ? ' active' : ''}`} onClick={() => setShowUserDropdown(false)}>
                          <span className="dropdown-icon"><ShieldCheck size={18} /></span> Admin Panel
                        </Link>
                      )}
                      
                      <div className="dropdown-divider"></div>
                      
                      <button className="dropdown-item logout-item" onClick={handleLogout}>
                        <span className="dropdown-icon"><LogOut size={18} /></span> Logout
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
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
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
                <span className="nav-icon"><Calendar size={18} /></span> Meal Schedule
              </Link>
              <Link to="/inventory" className={`navbar-link${location.pathname === '/inventory' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon"><Package size={18} /></span> Ingredients
              </Link>
              <Link to="/shoppinglist" className={`navbar-link${location.pathname === '/shoppinglist' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon"><ShoppingCart size={18} /></span> Shopping List
              </Link>
              <Link to="/leftovers" className={`navbar-link${location.pathname === '/leftovers' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon"><ChefHat size={18} /></span> Leftovers
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
