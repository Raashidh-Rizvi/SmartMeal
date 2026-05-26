<<<<<<< HEAD
/**
 * EditItemPage
 * Dedicated page for editing existing shopping items
 * Clean, focused interface for item modification
 */

function EditItemPage() {
  const { useState, useEffect } = React;
  const { useNavigate, useParams } = ReactRouterDOM;

  const navigate = useNavigate();
  const { itemId } = useParams();
  
  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piece');
=======
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ShoppingAPI from '../../services/shoppingApi';
import { AuthContext } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import { ArrowLeft, Edit3, Zap, Check, Clock, Trash2 } from 'lucide-react';

function EditItemPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { user } = useContext(AuthContext);
  const userId = user?.id || user?._id;
  
  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs', 'Piece', 'Pack', 'Dozen', 'slice', 'bottle', 'jar', 'cup', 'tbsp', 'tsp', 'pinch'];
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  const [source, setSource] = useState('Manual');
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);
  const [originalItem, setOriginalItem] = useState(null);
<<<<<<< HEAD

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Load item data on mount
  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    if (!itemId) return;
=======
  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadItem = useCallback(async () => {
    if (!itemId || !userId) return;
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    
    setFetching(true);
    try {
      // Get all items and find the one we need
<<<<<<< HEAD
      const items = await ShoppingAPI.getItems('user123');
=======
      const items = await ShoppingAPI.getItems(userId);
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
      const item = items.find(i => (i.id || i._id) === itemId);
      
      if (item) {
        setOriginalItem(item);
<<<<<<< HEAD
        set_item_name(item.item_name || '');
        setQuantity(item.quantity || 1);
        setUnit(item.unit || 'piece');
        setSource(item.source || 'Manual');
        setStatus(item.status || 'Pending');
      } else {
        showToast('Item not found', 'error');
        navigate('/');
=======
        set_item_name(item.name || item.item_name || '');
        setQuantity(item.quantity || 1);
        setUnit(item.unit || 'pcs');
        setSource(item.source || 'Manual');
        setStatus(item.status === 'pending' ? 'Pending' : item.status === 'bought' ? 'Bought' : item.status || 'Pending');
      } else {
        showToast('Item not found', 'error');
        navigate('/shopping');
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
      }
    } catch (error) {
      console.error('Error loading item:', error);
      showToast('Failed to load item', 'error');
<<<<<<< HEAD
      navigate('/');
    }
    setFetching(false);
  };
=======
      navigate('/shopping');
    }
    setFetching(false);
  }, [itemId, userId, navigate]);

  // Load item data on mount
  useEffect(() => {
    loadItem();
  }, [loadItem]);

>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item_name.trim()) return;

    setLoading(true);
    try {
      await ShoppingAPI.updateItem(itemId, {
<<<<<<< HEAD
        item_name: item_name.trim(),
=======
        name: item_name.trim(),
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        quantity: parseFloat(quantity),
        unit,
        source,
        status
      });
      showToast('Item updated successfully!', 'success');
<<<<<<< HEAD
      navigate('/');
=======
      navigate('/shopping');
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    } catch (error) {
      console.error('Error updating item:', error);
      showToast(error.message || 'Failed to update item', 'error');
    }
    setLoading(false);
  };

  const goBack = () => {
<<<<<<< HEAD
    navigate('/');
=======
    navigate('/shopping');
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setLoading(true);
    try {
      await ShoppingAPI.deleteItem(itemId);
      showToast('Item deleted successfully!', 'success');
<<<<<<< HEAD
      navigate('/');
=======
      navigate('/shopping');
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast(error.message || 'Failed to delete item', 'error');
    }
    setLoading(false);
  };

  const handleMarkBought = async () => {
    setLoading(true);
    try {
      await ShoppingAPI.markBought(itemId);
      showToast('Item marked as bought!', 'success');
      setStatus('Bought');
    } catch (error) {
      console.error('Error marking item:', error);
      showToast(error.message || 'Failed to update item', 'error');
    }
    setLoading(false);
  };

<<<<<<< HEAD
=======
  const handleMarkPending = async () => {
    setLoading(true);
    try {
      await ShoppingAPI.updateItem(itemId, { status: 'Pending' });
      showToast('Item marked as pending!', 'success');
      setStatus('Pending');
    } catch (error) {
      console.error('Error marking item:', error);
      showToast(error.message || 'Failed to update item', 'error');
    }
    setLoading(false);
  };

>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  if (fetching) {
    return (
      <div className="edit-item-page">
        <div className="loading-container">
          <div className="loading"></div>
          <p>Loading item...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-item-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
<<<<<<< HEAD
          <button onClick={goBack} className="btn-back">← Back to List</button>
          <h1>✏️ Edit Item</h1>
=======
          <button onClick={goBack} className="btn-back" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Back to List
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Edit3 size={32} /> Edit Item
          </h1>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
          <p>Modify your shopping item details</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="edit-item-container">
          <section className="card edit-item-card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Item Name</label>
                    <input
                      type="text"
                      value={item_name}
                      onChange={(e) => set_item_name(e.target.value)}
                      placeholder="e.g., Rice, Milk, Eggs"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value))}
                      min="0.1"
                      step="0.1"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      disabled={loading}
                    >
<<<<<<< HEAD
                      <option value="piece">Piece</option>
                      <option value="kg">Kg</option>
                      <option value="g">Grams</option>
                      <option value="L">Liter</option>
                      <option value="ml">ML</option>
                      <option value="pack">Pack</option>
                      <option value="dozen">Dozen</option>
=======
                      <option value="">Select unit</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Source</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      disabled={loading}
                    >
                      <option value="Manual">Manual</option>
                      <option value="MealPlan">Meal Plan</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={loading}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Bought">Bought</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Created</label>
                    <input
                      type="text"
                      value={originalItem ? new Date(originalItem.created_at).toLocaleDateString() : ''}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary btn-large"
                    disabled={loading || !item_name.trim()}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Action Buttons */}
          <section className="card actions-card">
<<<<<<< HEAD
            <div className="card-header">
              <h3>⚡ Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="action-buttons">
                {status === 'Pending' && (
=======
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Zap size={20} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="action-buttons">
{status === 'Pending' && (
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                  <button
                    onClick={handleMarkBought}
                    className="btn-success"
                    disabled={loading}
<<<<<<< HEAD
                  >
                    ✓ Mark as Bought
=======
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                  >
                    <Check size={18} /> Mark as Bought
                  </button>
                )}
                {status === 'Bought' && (
                  <button
                    onClick={handleMarkPending}
                    className="btn-warning"
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                  >
                    <Clock size={18} /> Mark as Pending
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                  disabled={loading}
<<<<<<< HEAD
                >
                  🗑 Delete Item
=======
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                >
                  <Trash2 size={18} /> Delete Item
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
<<<<<<< HEAD
=======

export default EditItemPage;
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
