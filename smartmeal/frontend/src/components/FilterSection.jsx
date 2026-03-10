/**
 * FilterSection Component
 * Provides status filter dropdown and action buttons (Clear Bought Items)
 */
import React from 'react';

function FilterSection({ statusFilter, onFilterChange, onClearBought }) {
  return (
    <section className="filter-section">
      <div className="filter-group">
        <label>Filter by Status:</label>
        <select value={statusFilter} onChange={(e) => onFilterChange(e.target.value)}>
          <option value="">All Items</option>
          <option value="Pending">Pending</option>
          <option value="Bought">Bought</option>
        </select>
      </div>
      <div className="action-buttons">
        <button onClick={onClearBought} className="btn-secondary btn-small">
          🗑 Clear Bought
        </button>
      </div>
    </section>
  );
}

export default FilterSection;
