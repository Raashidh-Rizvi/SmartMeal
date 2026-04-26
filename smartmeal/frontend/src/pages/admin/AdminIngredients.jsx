import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { 
  Apple, 
  Plus, 
  Search, 
  Trash2, 
  Pencil, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';

function AdminIngredients() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    calories: 0
  });

  const limit = 15;

  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      let params = new URLSearchParams({ page, limit });
      if (search) params.append('search', search);

      const res = await api.get(`/api/admin/ingredients?${params.toString()}`);
      setItems(res.data.items);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error(err);
      // alert removed
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIngredients();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    fetchIngredients();
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Delete this ingredient?")) {
      try {
        await api.delete(`/api/admin/ingredients/${itemId}`);
        fetchIngredients();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete");
      }
    }
  };

  const openFormModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        calories: item.calories
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        unit: '',
        calories: 0
      });
    }
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/api/admin/ingredients/${editingItem._id}`, formData);
      } else {
        await api.post('/api/admin/ingredients', formData);
      }
      setShowModal(false);
      fetchIngredients();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save ingredient");
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header flex justify-between align-center" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justify_content: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Apple size={32} color="var(--primary)" />
          <h1 style={{ margin: 0 }}>Ingredient Management</h1>
        </div>
        <button onClick={() => openFormModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}>
          <Plus size={18} /> Add Ingredient
        </button>
      </header>

      <div className="admin-filters">
        <form onSubmit={handleSearchSubmit} className="search-form flex gap-3 flex-wrap">
          <input 
            type="text" 
            placeholder="Search Ingredients" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
          />
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={16} /> Search
          </button>
          <button type="button" onClick={handleClearSearch} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <X size={16} /> Clear
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading ingredients...</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ingredient Identity</th>
                <th>Category</th>
                <th>Standard Unit</th>
                <th>Nutrition (Cal)</th>
                <th style={{ textAlign: 'right', minWidth: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td>
                    <div className="user-identity">
                      <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
                        {item.name.charAt(0)}
                      </div>
                      <div className="user-info-stack">
                        <div className="user-name">{item.name}</div>
                        <div className="user-email">ID: {item._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(54, 162, 235, 0.08)', color: '#36A2EB' }}>
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.unit}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {item.calories} kcal
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => openFormModal(item)} className="btn-icon" title="Edit Ingredient">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="btn-icon text-danger" title="Remove Item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">No ingredients found</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="admin-pagination mt-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
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

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{editingItem ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
            <form onSubmit={handleFormSubmit} className="auth-form mt-4">
              <div className="form-group mb-3">
                <label>Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  className="auth-input"
                />
              </div>
              <div className="form-group mb-3">
                <label>Category</label>
                <input 
                  type="text" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  required
                  className="auth-input"
                />
              </div>
              <div className="form-group mb-3">
                <label>Unit (e.g. g, ml, piece)</label>
                <input 
                  type="text" 
                  value={formData.unit} 
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  required
                  className="auth-input"
                />
              </div>
              <div className="form-group mb-4">
                <label>Calories</label>
                <input 
                  type="number" 
                  value={formData.calories} 
                  onChange={e => setFormData({...formData, calories: parseInt(e.target.value) || 0})}
                  required
                  className="auth-input"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">{editingItem ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminIngredients;
