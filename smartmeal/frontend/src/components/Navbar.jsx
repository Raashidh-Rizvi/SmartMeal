import React, { useContext } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isRecipesActive = location.pathname === '/recipes';
    const isMyRecipesActive = location.pathname === '/my-recipes';

    return (
        <header className="navbar">
            <div className="navbar-brand">
                <span>SmartMeal</span>
            </div>

            <nav className="navbar-links">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                    Dashboard
                </NavLink>

                <Link to="/recipes" className={`nav-link${isRecipesActive ? ' active' : ''}`}>
                    Recipes
                </Link>

                {user && (
                    <Link to="/my-recipes" className={`nav-link${isMyRecipesActive ? ' active' : ''}`}>
                        My Recipes
                    </Link>
                )}

                <NavLink
                    to="/profile"
                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                    Profile
                </NavLink>
            </nav>

            <div className="navbar-actions">
                <button
                    className="btn-icon"
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDark ? '☀️' : '🌙'}
                </button>
                {user && (
                    <button className="btn-danger-sm" onClick={handleLogout}>
                        Log Out
                    </button>
                )}
            </div>
        </header>
    );
}

export default Navbar;

