<<<<<<< HEAD
/**
 * StatsSection Component
 * Displays summary stat cards: Total Items, Pending, Bought
 */
import React from 'react';
=======
import React from 'react';
import { List, Clock, CheckCircle } from 'lucide-react';
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

function StatsSection({ stats }) {
  return (
    <section className="stats-section">
      <div className="stat-card">
<<<<<<< HEAD
        <div className="stat-icon">📋</div>
=======
        <div className="stat-icon">
          <List size={22} />
        </div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        <div className="stat-info">
          <h3>Total Items</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
      </div>
      <div className="stat-card pending">
<<<<<<< HEAD
        <div className="stat-icon">⏳</div>
=======
        <div className="stat-icon">
          <Clock size={22} />
        </div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        <div className="stat-info">
          <h3>Pending</h3>
          <p className="stat-value">{stats.pending}</p>
        </div>
      </div>
      <div className="stat-card bought">
<<<<<<< HEAD
        <div className="stat-icon">✅</div>
=======
        <div className="stat-icon">
          <CheckCircle size={22} />
        </div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        <div className="stat-info">
          <h3>Bought</h3>
          <p className="stat-value">{stats.bought}</p>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
