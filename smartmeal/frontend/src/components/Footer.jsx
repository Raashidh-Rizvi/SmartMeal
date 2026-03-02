import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>🌿 SmartMeal</h3>
          <p>Your intelligent recipe and meal planning assistant.</p>
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h4>Features</h4>
            <Link to="/inventory">Inventory</Link>
            <Link to="/recommendations">Recommendations</Link>
            <Link to="/mealplan">Meal Plan</Link>
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
        <p>&copy; {currentYear} SmartMeal. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
