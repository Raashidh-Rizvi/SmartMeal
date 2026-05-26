import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { 
  XCircle, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  CalendarOff, 
  Inbox,
  ChefHat,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Info,
  ClipboardList,
  Archive,
  Box,
  UtensilsCrossed,
  Flame,
  Leaf
} from 'lucide-react';

const UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs', 'Piece', 'Pack', 'Dozen', 'slice', 'bottle', 'jar', 'cup', 'tbsp', 'tsp', 'pinch'];

// Calculate days until expiry and return status
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'none', daysLeft: null, label: 'None', icon: null };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diff = expiry.getTime() - today.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) {
    return { status: 'expired', daysLeft: Math.abs(daysLeft), label: 'Expired', icon: <XCircle size={14} /> };
  } else if (daysLeft === 0) {
    return { status: 'expiring-today', daysLeft: 0, label: 'Expiring Today', icon: <AlertTriangle size={14} /> };
  } else if (daysLeft <= 3) {
    return { status: 'expiring-soon', daysLeft, label: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`, icon: <AlertCircle size={14} /> };
  } else if (daysLeft <= 7) {
    return { status: 'expiring-week', daysLeft, label: `${daysLeft} days left`, icon: <AlertCircle size={14} /> };
  }
  return { status: 'ok', daysLeft, label: `${daysLeft} days left`, icon: <CheckCircle size={14} /> };
};

function Inventory() {
  const [items, setItems] = useState([]);
  const [globalIngredients, setGlobalIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'expiry'
  

  // Modal state

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

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/inventory?page=${page}&limit=${limit}`);
      setItems(res.data.items);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error(err);
      // Removed alert, using console instead as per repo pattern for silent errors
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const fetchGlobalIngredients = useCallback(async () => {
    try {
      // Fetch all global ingredients for suggestions
      const res = await api.get('/api/admin/ingredients?limit=100');
      setGlobalIngredients(res.data.items || []);
    } catch (err) {
      console.error('Failed to load ingredient suggestions', err);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchGlobalIngredients();
  }, [fetchInventory, fetchGlobalIngredients]);

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
      // Modal will be centered via CSS, no need to scroll
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
    <>
    <div className="page-hero page-hero--sub">
      {/* Premium Decorative Background Icons - Scattered Artistically */}
      <UtensilsCrossed size={68} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '15%', left: '8%', '--rotation': '-15deg', animationDelay: '0s' }} />
      <ChefHat size={84} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '45%', left: '3%', '--rotation': '10deg', animationDelay: '1.2s' }} />
      <Flame size={54} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '20%', left: '12%', '--rotation': '25deg', animationDelay: '2.5s' }} />
      <Leaf size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '10%', right: '12%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
      
      <Package size={58} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '55%', right: '6%', '--rotation': '18deg', animationDelay: '3.1s' }} />
      <ClipboardList size={64} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '10%', right: '15%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
      <Inbox size={78} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '35%', right: '22%', '--rotation': '30deg', animationDelay: '4.2s' }} />
      <Box size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '35%', left: '28%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

      <ChefHat size={48} color="#10b981" style={{ position: 'relative', zIndex: 1 }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>My Inventory</h1>
        <p style={{ margin: '0.5rem 0 0', fontSize: '1.1rem' }}>Manage your ingredients here. Add items you have in your kitchen.</p>
      </div>
      <button onClick={() => openFormModal()} className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 1, padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
        <Plus size={18} /> Add Item
      </button>
    </div>

    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px', padding: '2rem' }}>

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
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {expired > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc3545', fontWeight: 'bold' }}>
                <XCircle size={18} /> 
                <span>{expired} item{expired !== 1 ? 's' : ''} expired - please discard</span>
              </div>}
              {expiringSoon > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontWeight: 'bold' }}>
                <AlertTriangle size={18} />
                <span>{expiringSoon} item{expiringSoon !== 1 ? 's' : ''} expiring soon - use first!</span>
              </div>}
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: 
                              expiryInfo.status === 'expired' ? '#dc3545' :
                              expiryInfo.status === 'expiring-today' ? '#d97706' :
                              expiryInfo.status === 'expiring-soon' ? '#d97706' :
                              '#6b7280'
                          }}>
                            {expiryInfo.icon} {expiryInfo.label}
                          </div>
                        </>
                      ) : 'None'}
                    </td>
                    <td>{item.notes || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => openFormModal(item)} className="btn-action" title="Edit">
                          <Pencil size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="btn-action btn-action--danger">
                          <Trash2 size={14} /> Discard
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
                      <Inbox size={48} color="#cbd5e1" />
                      <p>Your kitchen is empty. Add some ingredients!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          
        <div className="admin-pagination mt-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontWeight: 500 }}>Page {page} of {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

    </div>
      {showModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingItem ? <Pencil size={24} color="var(--primary)" /> : <Plus size={24} color="var(--primary)" />} {editingItem ? 'Edit Item' : 'Add Item'}</h2>
            <form onSubmit={handleFormSubmit} className="auth-form">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Ingredient Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => handleIngredientSelect(e.target.value)}
                    required
                    list="ingredient-suggestions"
                    placeholder="E.g., Apples, Milk, Chicken"
                  />
                  <datalist id="ingredient-suggestions">
                    {globalIngredients.map(ing => (
                      <option key={ing._id} value={ing.name} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group form-group-full">
                  <label>Category (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Produce, Dairy, Meat etc."
                  />
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    required
                  >
                    <option value="">Select unit</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div className="form-group form-group-full">
                  <label>Expiry Date (Optional)</label>
                  <input 
                    type="date" 
                    value={formData.expiryDate} 
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Notes (Optional)</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                    placeholder="Low fat, organic, etc."
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary flex-1">{editingItem ? 'Update' : 'Add to Kitchen'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default Inventory;
