import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs', 'Piece', 'Pack', 'Dozen', 'slice', 'bottle', 'jar', 'cup', 'tbsp', 'tsp', 'pinch'];

// Calculate days until expiry and return status
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'none', daysLeft: null, label: 'None' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diff = expiry.getTime() - today.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) {
    return { status: 'expired', daysLeft: Math.abs(daysLeft), label: '❌ Expired' };
  } else if (daysLeft === 0) {
    return { status: 'expiring-today', daysLeft: 0, label: '⚠️ Expiring Today' };
  } else if (daysLeft <= 3) {
    return { status: 'expiring-soon', daysLeft, label: `🔴 ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` };
  } else if (daysLeft <= 7) {
    return { status: 'expiring-week', daysLeft, label: `🟡 ${daysLeft} days left` };
  }
  return { status: 'ok', daysLeft, label: `✓ ${daysLeft} days left` };
};

function Inventory() {
  const [items, setItems] = useState([]);
  const [globalIngredients, setGlobalIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'expiry'
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    unit: '',
    expiryDate: '',
    notes: ''
  });

  const limit = 15;

  // Calculate summary of expiring items
  const getExpirySummary = () => {
    const expired = items.filter(i => getExpiryStatus(i.expiryDate).status === 'expired').length;
    const expiringSoon = items.filter(i => {
      const status = getExpiryStatus(i.expiryDate).status;
      return status === 'expiring-today' || status === 'expiring-soon';
    }).length;
    
    return { expired, expiringSoon };
  };

  // Sort items based on sortBy
  const getSortedItems = () => {
    const itemsCopy = [...items];
    if (sortBy === 'expiry') {
      return itemsCopy.sort((a, b) => {
        const aStatus = getExpiryStatus(a.expiryDate);
        const bStatus = getExpiryStatus(b.expiryDate);
        
        // Priority: expired > expiring soon > expiring week > ok > none
        const priorityMap = { expired: 0, 'expiring-today': 1, 'expiring-soon': 2, 'expiring-week': 3, ok: 4, none: 5 };
        const aPriority = priorityMap[aStatus.status] || 5;
        const bPriority = priorityMap[bStatus.status] || 5;
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // If same priority, sort by daysLeft (ascending for expired)
        if (aStatus.daysLeft === null) return 1;
        if (bStatus.daysLeft === null) return -1;
        return aStatus.daysLeft - bStatus.daysLeft;
      });
    }
    return itemsCopy;
  };

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
        unit: item.unit || '',
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
        notes: item.notes || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        quantity: 1,
        unit: '',
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

      {/* Expiry Alert Summary */}
      {(() => {
        const { expired, expiringSoon } = getExpirySummary();
        if (expired > 0 || expiringSoon > 0) {
          return (
            <div style={{
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '6px',
              backgroundColor: expired > 0 ? '#fee' : '#fff3cd',
              borderLeft: `4px solid ${expired > 0 ? '#dc3545' : '#ffc107'}`,
            }}>
              {expired > 0 && <p style={{ margin: '0 0 4px 0', color: '#dc3545', fontWeight: 'bold' }}>
                ❌ {expired} item{expired !== 1 ? 's' : ''} expired - please discard
              </p>}
              {expiringSoon > 0 && <p style={{ margin: 0, color: '#d97706', fontWeight: 'bold' }}>
                ⚠️ {expiringSoon} item{expiringSoon !== 1 ? 's' : ''} expiring soon - use first!
              </p>}
            </div>
          );
        }
        return null;
      })()}

      {loading ? (
        <p>Loading your kitchen items...</p>
      ) : (
        <>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <span>Sort by:</span>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="name">Name</option>
                <option value="expiry">Expiry Date</option>
              </select>
            </label>
          </div>

          <div className="table-responsive" style={{ flexGrow: 1 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Expiry Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedItems().map(item => {
                const expiryInfo = getExpiryStatus(item.expiryDate);
                const rowStyle = {
                  backgroundColor: 
                    expiryInfo.status === 'expired' ? '#fee' :
                    expiryInfo.status === 'expiring-today' ? '#fff3cd' :
                    expiryInfo.status === 'expiring-soon' ? '#fff3cd' :
                    expiryInfo.status === 'expiring-week' ? '#f0f8ff' :
                    'transparent'
                };
                
                return (
                  <tr key={item._id} style={rowStyle}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit || '-'}</td>
                    <td>
                      {item.expiryDate ? (
                        <>
                          <div>{new Date(item.expiryDate).toLocaleDateString()}</div>
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 'bold',
                            color: 
                              expiryInfo.status === 'expired' ? '#dc3545' :
                              expiryInfo.status === 'expiring-today' ? '#d97706' :
                              expiryInfo.status === 'expiring-soon' ? '#d97706' :
                              '#6b7280'
                          }}>
                            {expiryInfo.label}
                          </div>
                        </>
                      ) : 'None'}
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
                  <td colSpan="7" className="text-center">Your kitchen is empty. Add some ingredients!</td>
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                    required
                    className="auth-input"
                    style={{ flex: 1 }}
                  />
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="auth-input"
                    style={{ flex: 1 }}
                    required
                  >
                    <option value="">Select unit</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  value={formData.expiryDate} 
                  onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
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
