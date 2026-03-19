import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

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

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      let params = new URLSearchParams({ page, limit });
      if (search) params.append('search', search);

      const res = await api.get(`/api/admin/ingredients?${params.toString()}`);
      setItems(res.data.items);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error(err);
      alert('Error fetching ingredients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
      <header className="admin-header flex justify-between align-center">
        <h1>Ingredient Management</h1>
        <button onClick={() => openFormModal()} className="btn btn-primary">Add Ingredient</button>
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
          <button type="submit" className="btn btn-primary">Search</button>
          <button type="button" onClick={handleClearSearch} className="btn btn-secondary">Clear</button>
        </form>
      </div>

      {loading ? (
        <p>Loading ingredients...</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ingredient Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Calories</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.category || '-'}</td>
                  <td>{item.unit}</td>
                  <td>{item.calories}</td>
                  <td>
                    <button onClick={() => openFormModal(item)} className="btn-icon">Edit</button>
                    {' | '}
                    <button onClick={() => handleDelete(item._id)} className="btn-icon text-danger">Delete</button>
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
          
          <div className="admin-pagination mt-4">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-secondary mr-2">Prev</button>
            <span>Page {page} of {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary ml-2">Next</button>
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
