import React, { useState, useEffect } from 'react';
import api from '../api/axios';

function Inventory() {
  const [items, setItems] = useState([]);
  const [globalIngredients, setGlobalIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    expiryDate: '',
    notes: ''
  });

  const limit = 15;

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/inventory?page=${page}&limit=${limit}`);
      setItems(res.data.items);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error(err);
      alert('Error fetching inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalIngredients = async () => {
    try {
      // Fetch all global ingredients for suggestions
      const res = await api.get('/api/admin/ingredients?limit=100');
      setGlobalIngredients(res.data.items || []);
    } catch (err) {
      console.error('Failed to load ingredient suggestions', err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchGlobalIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (itemId) => {
    if (window.confirm("Remove this item from your inventory?")) {
      try {
        await api.delete(`/api/inventory/${itemId}`);
        fetchInventory();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete item");
      }
    }
  };

  const openFormModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category || '',
        quantity: item.quantity || 1,
        // Format date string for the input
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
        notes: item.notes || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        quantity: 1,
        expiryDate: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // Convert empty string to null for date
      if (!submitData.expiryDate) {
        submitData.expiryDate = null;
      } else {
        submitData.expiryDate = new Date(submitData.expiryDate).toISOString();
      }

      if (editingItem) {
        await api.put(`/api/inventory/${editingItem._id}`, submitData);
      } else {
        await api.post('/api/inventory', submitData);
      }
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save item");
    }
  };

  const handleIngredientSelect = (ingredientName) => {
    const selected = globalIngredients.find(i => i.name === ingredientName);
    if (selected) {
      setFormData({
        ...formData,
        name: selected.name,
        category: selected.category || formData.category
      });
    } else {
      // Free-typing
      setFormData({ ...formData, name: ingredientName });
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
      <div className="flex justify-between align-center mb-4">
        <div>
          <h2>My Inventory</h2>
          <p className="text-muted">Manage your ingredients here. Add items you have in your kitchen.</p>
        </div>
        <button onClick={() => openFormModal()} className="btn btn-primary">Add Item</button>
      </div>

      {loading ? (
        <p>Loading your kitchen items...</p>
      ) : (
        <>
          <div className="table-responsive" style={{ flexGrow: 1 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                return (
                  <tr key={item._id} className={isExpired ? 'row-danger' : ''}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'None'}
                      {isExpired && <span className="text-danger ms-2">Expired</span>}
                    </td>
                    <td>{item.notes || '-'}</td>
                    <td>
                      <button onClick={() => openFormModal(item)} className="btn-icon">Edit</button>
                      {' | '}
                      <button onClick={() => handleDelete(item._id)} className="btn-icon text-danger">Discard</button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">Your kitchen is empty. Add some ingredients!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          
        <div className="admin-pagination mt-4">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-secondary mr-2">Prev</button>
            <span>Page {page} of {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary ml-2">Next</button>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <h2>{editingItem ? 'Edit Kitchen Item' : 'Add Kitchen Item'}</h2>
            <form onSubmit={handleFormSubmit} className="auth-form mt-4">
              
              <div className="form-group mb-3">
                <label>Ingredient Name</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => handleIngredientSelect(e.target.value)}
                    required
                    className="auth-input"
                    list="ingredient-suggestions"
                    placeholder="E.g., Apples, Milk, Chicken"
                  />
                  <datalist id="ingredient-suggestions">
                    {globalIngredients.map(ing => (
                      <option key={ing._id} value={ing.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Category (Optional)</label>
                <input 
                  type="text" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="auth-input"
                  placeholder="Produce, Dairy, Meat etc."
                />
              </div>

              <div className="form-group mb-3">
                <label>Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  required
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label>Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  value={formData.expiryDate} 
                  onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-4">
                <label>Notes (Optional)</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="auth-input"
                  rows="2"
                  placeholder="Low fat, organic, etc."
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">{editingItem ? 'Update Item' : 'Add to Kitchen'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
