/**
 * EditItemForm Component
 * Dedicated form for editing existing shopping items
 */
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShoppingAPI } from '../api/axios';

function EditItemForm({ itemId, onSave, onCancel, onDelete }) {
  const { user } = useContext(AuthContext);
  const userId = user?.uid || user?.id || user?._id || '';

  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity]   = useState(1);
  const [unit, setUnit]           = useState('pcs');
  const UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs', 'Piece', 'Pack', 'Dozen', 'slice', 'bottle', 'jar', 'cup', 'tbsp', 'tsp', 'pinch'];
  const [source, setSource]       = useState('Manual');
  const [status, setStatus]       = useState('Pending');
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [originalItem, setOriginalItem] = useState(null);

  const loadItem = async () => {
    if (!itemId) return;
    setFetching(true);
    try {
      const items = await ShoppingAPI.getItems(userId);
      const item = items.find(i => (i.id || i._id) === itemId);
      if (item) {
        setOriginalItem(item);
        set_item_name(item.item_name || '');
        setQuantity(item.quantity || 1);
        setUnit(item.unit || 'piece');
        setSource(item.source || 'Manual');
        setStatus(item.status || 'Pending');
      } else {
        alert('Item not found');
        onCancel();
      }
    } catch (error) {
      console.error('Error loading item:', error);
      alert('Failed to load item');
      onCancel();
    }
    setFetching(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadItem(); }, [itemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item_name.trim()) return;
    setLoading(true);
    try {
      await ShoppingAPI.updateItem(itemId, {
        item_name: item_name.trim(),
        quantity: parseFloat(quantity),
        unit,
        source,
        status,
      });
      onSave();
    } catch (error) {
      alert(error.message || 'Failed to update item');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this item?')) return;
    setLoading(true);
    try {
      await ShoppingAPI.deleteItem(itemId);
      onDelete();
    } catch (error) {
      alert(error.message || 'Failed to delete item');
    }
    setLoading(false);
  };

  const handleMarkBought = async () => {
    setLoading(true);
    try {
      await ShoppingAPI.markBought(itemId);
      setStatus('Bought');
    } catch (error) {
      alert(error.message || 'Failed to update item');
    }
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>Loading item...</p>
      </div>
    );
  }

  return (
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
              <select value={unit} onChange={(e) => setUnit(e.target.value)} disabled={loading}>
                <option value="">Select unit</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} disabled={loading}>
                <option value="Manual">Manual</option>
                <option value="MealPlan">Meal Plan</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={loading}>
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
              />
            </div>
          </div>

          <div className="shopping-form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !item_name.trim()}>
              {loading ? 'Saving…' : '💾 Save Changes'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
              ❌ Cancel
            </button>
          </div>
        </form>

        <div className="edit-action-buttons">
          {status === 'Pending' && (
            <button onClick={handleMarkBought} className="btn-primary btn-small" disabled={loading}>
              ✓ Mark as Bought
            </button>
          )}
          <button onClick={handleDelete} className="btn-danger btn-small" disabled={loading}>
            🗑 Delete Item
          </button>
        </div>
      </div>
    </section>
  );
}

export default EditItemForm;
