<<<<<<< HEAD
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
=======
import React from 'react';
import { Search, FolderOpen, Trash2 } from 'lucide-react';

function FilterSection({ statusFilter, sourceFilter, onStatusChange, onSourceChange, onClearBought }) {
  // Ensure filters are always visible with inline styles
  const sectionStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%)',
    border: '2px solid #16a34a',
    borderRadius: '12px',
    flexWrap: 'wrap',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
  };
  const groupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  };
  const labelStyle = {
    fontWeight: '700',
    fontSize: '0.95rem',
    color: '#1f2937',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem'
  };
  const selectStyle = {
    padding: '0.6rem 1rem',
    minWidth: '140px',
    borderRadius: '8px',
    border: '2px solid #16a34a',
    backgroundColor: '#fff',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer'
  };
  const buttonStyle = {
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };
  
  return (
    <section className="filter-section" style={sectionStyle}>
      <div className="filter-group" style={groupStyle}>
        <label style={labelStyle}>
          <Search size={18} color="#16a34a" /> Status:
        </label>
        <select 
          value={statusFilter} 
          onChange={(e) => onStatusChange(e.target.value)} 
          style={selectStyle}
        >
          <option value="">All Items</option>
          <option value="pending">Pending</option>
          <option value="bought">Bought</option>
        </select>
      </div>
      <div className="filter-group" style={groupStyle}>
        <label style={labelStyle}>
          <FolderOpen size={18} color="#16a34a" /> Source:
        </label>
        <select 
          value={sourceFilter} 
          onChange={(e) => onSourceChange(e.target.value)} 
          style={selectStyle}
        >
          <option value="">All Sources</option>
          <option value="manual">Manual</option>
          <option value="meal-plan">Meal Plan</option>
        </select>
      </div>
      <div className="action-buttons" style={groupStyle}>
        <button onClick={onClearBought} style={buttonStyle}>
          <Trash2 size={18} /> Clear Bought
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        </button>
      </div>
    </section>
  );
}

export default FilterSection;
