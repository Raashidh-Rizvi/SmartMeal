import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>🍽️ Smart Recipe</h3>
          <p>Your intelligent recipe and meal planning assistant.</p>
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h4>Features</h4>
            <Link to="/inventory">Ingredients</Link>
            <Link to="/recommendations">Explore</Link>
            <Link to="/mealplan">Schedules</Link>
            <Link to="/shoppinglist">Shopping List</Link>
          </div>
          
          <div className="footer-section">
            <h4>Account</h4>
            <Link to="/profile">Profile</Link>
            <Link to="/change-password">Security</Link>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} Smart Recipe. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
