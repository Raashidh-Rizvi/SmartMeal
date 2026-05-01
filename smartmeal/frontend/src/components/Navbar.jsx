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
  UtensilsCrossed,
  Heart
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
  const [showBanner, setShowBanner] = useState(false);
  const [latestNotification, setLatestNotification] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const userDropdownRef = useRef(null);
  const prevCountRef = useRef(0);
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
          const currentCount = data.length || 0;
          
          if (currentCount > prevCountRef.current && user) {
            setLatestNotification(data[0]?.message || 'New notification received!');
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 3000);
          }
          
          setUnreadNotifications(currentCount);
          prevCountRef.current = currentCount;
        }
      } catch {
        setUnreadNotifications(0);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        // Always keep navbar visible in admin mode
        if (location.pathname.includes('/admin')) {
          setIsVisible(true);
          return;
        }
        
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          // scrolling down
          setIsVisible(false);
        } else {
          // scrolling up
          setIsVisible(true);
        }
        
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', controlNavbar);

    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className={`navbar ${!isVisible ? 'navbar--hidden' : ''}`}>
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
                  <Link to="/recipes?tab=favorites" className={`navbar-link${location.pathname.includes('/recipes') && new URLSearchParams(location.search).get('tab') === 'favorites' ? ' active' : ''}`} onClick={closeMenu}>
                    <span className="nav-icon"><Heart size={18} /></span> Favorites
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

          <div className="navbar-actions">
            {user ? (
              <div className="navbar-utility-btns">
                <button
                  type="button"
                  className="nav-trigger-bell"
                  title="View notifications"
                  onClick={() => setShowNotificationsModal(true)}
                >
                  <Bell size={24} />
                  {unreadNotifications > 0 && (
                    <span className="notification-badge" style={{ top: '2px', right: '2px', minWidth: '18px', height: '18px', padding: '0 4px', fontSize: '10px' }}>
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                
                <div className="user-dropdown-container" ref={userDropdownRef}>
                  <button 
                    className="nav-trigger-avatar-circle" 
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    title={user.name}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </button>

                  {showUserDropdown && (
                    <div className="user-dropdown-menu premium-popover">
                      <div className="dropdown-header-premium">
                        <p className="user-name">{user.name}</p>
                        <p className="user-email">{user.email}</p>
                      </div>
                      <div className="dropdown-divider" style={{ margin: '0 1.5rem 1rem', opacity: 0.1 }}></div>
                      
                      <Link to="/profile" className="dropdown-item-pill" onClick={() => setShowUserDropdown(false)}>
                        <User size={20} style={{ opacity: 0.7 }} /> Profile
                      </Link>
                      
                      <button className="dropdown-item-pill" onClick={() => { toggleTheme(); setShowUserDropdown(false); }}>
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        <span>Dark Mode</span>
                      </button>
                      
                      {isAdmin && (
                        <Link to="/admin" className="dropdown-item-pill" onClick={() => setShowUserDropdown(false)}>
                          <ShieldCheck size={20} style={{ opacity: 0.7 }} /> Admin Panel
                        </Link>
                      )}
                      
                      <div className="dropdown-divider" style={{ margin: '1rem 1.5rem', opacity: 0.1 }}></div>
                      
                      <button className="dropdown-item-pill" onClick={handleLogout}>
                        <LogOut size={20} style={{ opacity: 0.7 }} /> Logout
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
              <Link to="/recipes?tab=favorites" className={`navbar-link${location.pathname.includes('/recipes') && new URLSearchParams(location.search).get('tab') === 'favorites' ? ' active' : ''}`} onClick={closeMenu}>
                <span className="nav-icon"><Heart size={18} /></span> Favorites
              </Link>
            </div>
          </div>
        )}
      </nav>

      {menuOpen && ReactDOM.createPortal(
        <div className="navbar-overlay" onClick={closeMenu} />,
        document.body
      )}

      <NotificationsModal 
        isOpen={showNotificationsModal} 
        onClose={() => setShowNotificationsModal(false)} 
        onUnreadCountChange={setUnreadNotifications}
      />

      {/* Notification Banner */}
      {showBanner && (
        <div className="notification-banner">
          <Bell size={20} color="var(--primary)" />
          <span>{latestNotification}</span>
        </div>
      )}
    </>
  );
}

export default Navbar;
