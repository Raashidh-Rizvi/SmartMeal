import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  Pencil, 
  ChevronLeft, 
  ChevronRight,
  X,
  Database,
  FlaskConical,
  Tag,
  LayoutList,
  BookMarked
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
      <div className="page-hero page-hero--sub">
        {/* Premium Decorative Background Icons */}
        <Database size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '10%', left: '6%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <FlaskConical size={68} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '45%', left: '3%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <Tag size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '14%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <LayoutList size={74} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '12%', right: '10%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        <BookMarked size={62} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '55%', right: '5%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <Search size={66} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '12%', right: '16%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <FlaskConical size={80} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '32%', right: '26%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <Database size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '38%', left: '28%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <Database size={46} color="#10b981" style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0.25rem 0 0.1rem' }}>Ingredient Management</h1>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '1rem' }}>Manage the global ingredient database and nutritional data</p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'flex-end', width: '100%', padding: '0 1.5rem', boxSizing: 'border-box' }}>
          <button onClick={() => openFormModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}>
            <Plus size={18} /> Add Ingredient
          </button>
        </div>
      </div>

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
