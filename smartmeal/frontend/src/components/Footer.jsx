import React from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
=======
import { UtensilsCrossed } from 'lucide-react';
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
<<<<<<< HEAD
          <h3>🍽️ Smart Meal</h3>
=======
          <div className="footer-logo">
            <UtensilsCrossed size={28} color="var(--primary)" />
            <h3>Smart Meal</h3>
          </div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
          <p>Your intelligent recipe and meal planning assistant.</p>
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h4>Features</h4>
<<<<<<< HEAD
            <Link to="/inventory">Inventory</Link>
            <Link to="/recommendations">Recommendations</Link>
            <Link to="/mealplan">Meal Plan</Link>
=======
            <Link to="/inventory">Ingredients</Link>
            <Link to="/recommendations">Explore</Link>
            <Link to="/mealplan">Schedules</Link>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
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
        <p>&copy; {currentYear} Smart Meal. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
