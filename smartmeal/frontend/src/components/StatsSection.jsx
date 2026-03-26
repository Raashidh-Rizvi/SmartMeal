/**
 * StatsSection Component
 * Displays summary stat cards: Total Items, Pending, Bought
 */
import React from 'react';

function StatsSection({ stats }) {
  return (
    <section className="stats-section">
      <div className="stat-card">
        <div className="stat-icon">📋</div>
        <div className="stat-info">
          <h3>Total Items</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
      </div>
      <div className="stat-card pending">
        <div className="stat-icon">⏳</div>
        <div className="stat-info">
          <h3>Pending</h3>
          <p className="stat-value">{stats.pending}</p>
        </div>
      </div>
      <div className="stat-card bought">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <h3>Bought</h3>
          <p className="stat-value">{stats.bought}</p>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
