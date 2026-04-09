import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { 
  Search, 
  Filter, 
  Trash2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';

function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    userEmail: '',
    expiredOnly: false,
    expiringBefore: ''
  });
  const limit = 15;

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      let params = new URLSearchParams({ page, limit });
      if (filters.userEmail) params.append('userEmail', filters.userEmail);
      if (filters.expiredOnly) params.append('expiredOnly', 'true');
      if (filters.expiringBefore) {
        // Needs proper ISO format for backend, assuming date picker gives YYYY-MM-DD
        const dateObj = new Date(filters.expiringBefore);
        if (!isNaN(dateObj)) {
          params.append('expiringBefore', dateObj.toISOString());
        }
      }
      
      const res = await api.get(`/api/admin/inventory?${params.toString()}`);
      setItems(res.data.items);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error(err);
      alert('Error fetching inventory');
    } finally {
      setLoading(false);
    }
  }, [page, filters.expiredOnly, filters.userEmail, filters.expiringBefore, limit]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  const handleClearFilters = () => {
    setFilters({ userEmail: '', expiredOnly: false, expiringBefore: '' });
    setPage(1);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Delete this inventory item?")) {
      try {
        await api.delete(`/api/admin/inventory/${itemId}`);
        fetchInventory();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete");
      }
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ClipboardList size={32} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Inventory Oversight</h1>
      </header>

      <div className="admin-filters">
        <form onSubmit={handleFilterSubmit} className="search-form flex gap-3 flex-wrap">
          <input 
            type="email" 
            placeholder="Filter by User Email" 
            value={filters.userEmail}
            onChange={(e) => setFilters({...filters, userEmail: e.target.value})}
            className="admin-input"
          />
          
          <div className="flex align-center gap-2">
            <label>Expiring Before:</label>
            <input 
              type="date" 
              value={filters.expiringBefore}
              onChange={(e) => setFilters({...filters, expiringBefore: e.target.value})}
              className="admin-input"
            />
          </div>

          <label className="flex align-center gap-2">
            <input 
              type="checkbox" 
              checked={filters.expiredOnly}
              onChange={(e) => setFilters({...filters, expiredOnly: e.target.checked})}
            />
            Expired Only
          </label>

          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={16} /> Apply Filters
          </button>
          <button type="button" onClick={handleClearFilters} className="btn btn-secondary">Clear</button>
        </form>
      </div>

      {loading ? (
        <p>Loading inventory...</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>User Email</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                return (
                  <tr key={item._id} className={isExpired ? 'row-danger' : ''}>
                    <td>{item.name}</td>
                    <td>{item.userEmail}</td>
                    <td>{item.category || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {item.expiryDate 
                        ? new Date(item.expiryDate).toLocaleDateString() 
                        : 'No Expiry'}
                      {isExpired && <span className="warning-icon ms-2" style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center' }}><AlertTriangle size={14} /></span>}
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item._id)} className="btn-icon text-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">No inventory items found</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="admin-pagination" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontWeight: 500 }}>Page {page} of {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;
