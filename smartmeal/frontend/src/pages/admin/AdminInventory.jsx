<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
=======
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { 
  Search, 
  Filter, 
  Trash2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Package,
  ShieldAlert,
  BarChart2,
  Eye,
  ScanLine
} from 'lucide-react';
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

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

<<<<<<< HEAD
  const fetchInventory = async () => {
=======
  const fetchInventory = useCallback(async () => {
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    try {
      setLoading(true);
      let params = new URLSearchParams({ page, limit });
      if (filters.userEmail) params.append('userEmail', filters.userEmail);
      if (filters.expiredOnly) params.append('expiredOnly', 'true');
      if (filters.expiringBefore) {
<<<<<<< HEAD
        // Needs proper ISO format for backend, assuming date picker gives YYYY-MM-DD
=======
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        const dateObj = new Date(filters.expiringBefore);
        if (!isNaN(dateObj)) {
          params.append('expiringBefore', dateObj.toISOString());
        }
      }
      
      const res = await api.get(`/api/admin/inventory?${params.toString()}`);
<<<<<<< HEAD
      setItems(res.data.items);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error(err);
      alert('Error fetching inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, filters.expiredOnly]); // Manual trigger on some, auto on others
=======
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

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
<<<<<<< HEAD
      <header className="admin-header">
        <h1>Inventory Oversight</h1>
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
=======
      <div className="page-hero page-hero--sub">
        {/* Premium Decorative Background Icons */}
        <ClipboardList size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '10%', left: '6%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <Package size={68} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '45%', left: '3%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <ShieldAlert size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '14%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <BarChart2 size={74} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '12%', right: '10%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        <Eye size={62} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '55%', right: '5%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <ScanLine size={66} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '12%', right: '16%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <Package size={80} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '32%', right: '26%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <ClipboardList size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '38%', left: '28%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <ClipboardList size={46} color="#10b981" style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0.25rem 0 0.1rem' }}>Inventory Oversight</h1>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '1rem' }}>Monitor and manage global food inventory across all users</p>
        </div>
      </div>

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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
            <input 
              type="date" 
              value={filters.expiringBefore}
              onChange={(e) => setFilters({...filters, expiringBefore: e.target.value})}
              className="admin-input"
            />
          </div>

<<<<<<< HEAD
          <label className="flex align-center gap-2">
            <input 
              type="checkbox" 
              checked={filters.expiredOnly}
              onChange={(e) => setFilters({...filters, expiredOnly: e.target.checked})}
            />
            Expired Only
          </label>

          <button type="submit" className="btn btn-primary">Apply Filters</button>
          <button type="button" onClick={handleClearFilters} className="btn btn-secondary">Clear</button>
=======
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        </form>
      </div>

      {loading ? (
<<<<<<< HEAD
        <p>Loading inventory...</p>
=======
        <div className="admin-loading"><div className="loader"></div><p>Loading global inventory...</p></div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
<<<<<<< HEAD
                <th>Item Name</th>
                <th>User Email</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
=======
                <th>Item Details</th>
                <th>Owner (Email)</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Expiry Status</th>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                return (
                  <tr key={item._id} className={isExpired ? 'row-danger' : ''}>
<<<<<<< HEAD
                    <td>{item.name}</td>
                    <td>{item.userEmail}</td>
                    <td>{item.category || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {item.expiryDate 
                        ? new Date(item.expiryDate).toLocaleDateString() 
                        : 'No Expiry'}
                      {isExpired && <span className="warning-icon ms-2">⚠️</span>}
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item._id)} className="btn-icon text-danger">Delete</button>
=======
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
<<<<<<< HEAD
                  <td colSpan="6" className="text-center">No inventory items found</td>
=======
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No inventory records found.
                  </td>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="admin-pagination">
<<<<<<< HEAD
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-secondary">Prev</button>
            <span>Page {page} of {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary">Next</button>
=======
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-secondary" style={{ width: 'auto' }}>
              <ChevronLeft size={18} /> Prev
            </button>
            <span style={{ fontWeight: 700, minWidth: '80px', textAlign: 'center' }}>{page} / {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary" style={{ width: 'auto' }}>
              Next <ChevronRight size={18} />
            </button>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;
