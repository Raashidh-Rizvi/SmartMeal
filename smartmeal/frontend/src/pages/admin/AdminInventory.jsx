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
        const dateObj = new Date(filters.expiringBefore);
        if (!isNaN(dateObj)) {
          params.append('expiringBefore', dateObj.toISOString());
        }
      }
      
      const res = await api.get(`/api/admin/inventory?${params.toString()}`);
      setItems(res.data.items || []);
      setTotalPages(Math.ceil((res.data.total || 0) / limit));
    } catch (err) {
      console.error(err);
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
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ClipboardList size={32} color="var(--primary)" />
          <h1>Inventory Oversight</h1>
        </div>
        <p className="subtitle">Monitor and manage global food inventory across all users</p>
      </header>

      <div className="admin-filters">
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>Filter by User Email</label>
            <input 
              type="email" 
              placeholder="user@example.com" 
              value={filters.userEmail}
              onChange={(e) => setFilters({...filters, userEmail: e.target.value})}
              className="admin-input"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="form-group" style={{ width: 'auto', marginBottom: 0 }}>
            <label>Expiring Before</label>
            <input 
              type="date" 
              value={filters.expiringBefore}
              onChange={(e) => setFilters({...filters, expiringBefore: e.target.value})}
              className="admin-input"
            />
          </div>

          <div className="form-group" style={{ width: 'auto', marginBottom: 0, paddingBottom: '0.75rem' }}>
            <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal' }}>
              <input 
                type="checkbox" 
                checked={filters.expiredOnly}
                onChange={(e) => setFilters({...filters, expiredOnly: e.target.checked})}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Expired Items Only</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
              <Filter size={18} /> Apply
            </button>
            <button type="button" onClick={handleClearFilters} className="btn btn-secondary" style={{ width: 'auto' }}>
              Clear
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="loader"></div><p>Loading global inventory...</p></div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item Details</th>
                <th>Owner (Email)</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Expiry Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                return (
                  <tr key={item._id} className={isExpired ? 'row-danger' : ''}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                    </td>
                    <td>{item.userEmail}</td>
                    <td><span className="badge badge-user">{item.category || 'General'}</span></td>
                    <td>{item.quantity}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.expiryDate 
                          ? new Date(item.expiryDate).toLocaleDateString() 
                          : 'No Expiry'}
                        {isExpired && (
                          <span className="badge badge-inactive">
                            <AlertTriangle size={12} /> Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item._id)} className="btn-icon text-danger" title="Remove Item">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="admin-pagination">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-secondary" style={{ width: 'auto' }}>
              <ChevronLeft size={18} /> Prev
            </button>
            <span style={{ fontWeight: 700, minWidth: '80px', textAlign: 'center' }}>{page} / {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary" style={{ width: 'auto' }}>
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;
