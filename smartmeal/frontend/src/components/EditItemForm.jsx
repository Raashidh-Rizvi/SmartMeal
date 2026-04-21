/**
 * EditItemForm Component
 * Dedicated form for editing existing shopping items
 */
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ShoppingAPI from '../services/shoppingApi';

function EditItemForm({ itemId, user_id: propUserId, onSave, onCancel, onDelete }) {
  const { user } = useContext(AuthContext);
  const userId = propUserId || user?.uid || user?.id || user?._id || '1';

  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity]   = useState(1);
  const [unit, setUnit]           = useState('pcs');
  const UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs', 'Piece', 'Pack', 'Dozen', 'slice', 'bottle', 'jar', 'cup', 'tbsp', 'tsp', 'pinch'];
  const [source, setSource]       = useState('Manual');
  const [status, setStatus]       = useState('Pending');
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [originalItem, setOriginalItem] = useState(null);
  const [isCombined, setIsCombined] = useState(false);

  const loadItem = async () => {
    if (!itemId) return;
    setFetching(true);
    try {
      let item;
      const isMultiId = String(itemId).includes(',');
      
      if (isMultiId) {
        // It's a combined item from "All Sources" aggregated view
        const items = await ShoppingAPI.getItems(userId);
        item = items.find(i => String(i.id || i._id) === String(itemId));
      } else {
        // Fetch raw un-aggregated items for separate contexts
        const manualItems = await ShoppingAPI.getItems(userId, '', 'manual');
        item = manualItems.find(i => String(i.id || i._id) === String(itemId));
        if (!item) {
          const mealPlanItems = await ShoppingAPI.getItems(userId, '', 'meal-plan');
          item = mealPlanItems.find(i => String(i.id || i._id) === String(itemId));
        }
        // Fallback
        if (!item) {
          const items = await ShoppingAPI.getItems(userId);
          item = items.find(i => String(i.id || i._id) === String(itemId));
        }
      }

      if (item) {
        setOriginalItem(item);
        
        // Determine if item is aggregated from Multiple sources
        const combined = String(itemId).includes(',') || (item.source && item.source.includes('/'));
        setIsCombined(combined);

        set_item_name(item.name || item.item_name || '');
        setQuantity(item.quantity || 1);
        setUnit(item.unit || 'piece');
        
        // Convert backend source value to frontend format
        const itemSource = (item.source || '').toLowerCase();
        if (combined) {
          setSource('Combined');
        } else if (itemSource.includes('meal') || itemSource.includes('plan')) {
          setSource('MealPlan');
        } else {
          setSource('Manual');
        }
        
        // Convert backend status value to frontend format
        const itemStatus = (item.status || '').toLowerCase();
        setStatus(itemStatus === 'bought' ? 'Bought' : 'Pending');
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
      // Build update payload, omitting quantity and source if combined
      const payload = {
        name: item_name.trim(),
        unit: unit,
        status: status === 'Bought' ? 'bought' : 'pending',
      };
      
      if (!isCombined) {
        payload.quantity = parseFloat(quantity);
        payload.source = source === 'MealPlan' ? 'meal-plan' : 'manual';
      }

      await ShoppingAPI.updateItem(itemId, payload);
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

  const handleMarkPending = async () => {
    setLoading(true);
    try {
      await ShoppingAPI.updateItem(itemId, { status: 'Pending' });
      setStatus('Pending');
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
        
        {isCombined && (
          <div style={{ padding: '0.75rem', marginBottom: '1.25rem', backgroundColor: '#e2f5ec', color: '#10643b', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', border: '1px solid #16a34a' }}>
            <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
            <div>
              <strong>Aggregated Item:</strong> You are editing an item that combines quantities from multiple sources (Manual & Meal Plan). To prevent data sync issues, <strong>Quantity</strong> and <strong>Source</strong> cannot be edited here.
            </div>
          </div>
        )}

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
                disabled={loading || isCombined}
                title={isCombined ? "Quantity cannot be edited for aggregated items." : ""}
                style={isCombined ? { backgroundColor: '#f3f4f6', color: '#6b7280' } : {}}
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
              <select value={source} onChange={(e) => setSource(e.target.value)} 
                disabled={loading || isCombined}
                title={isCombined ? "Source cannot be edited for aggregated items." : ""}
                style={isCombined ? { backgroundColor: '#f3f4f6', color: '#6b7280' } : {}}
              >
                <option value="Manual">Manual</option>
                <option value="MealPlan">Meal Plan</option>
                {isCombined && <option value="Combined">Manual / Meal Plan</option>}
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
                style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
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
            <button onClick={handleMarkBought} className="btn-success btn-small" disabled={loading}>
              ✓ Mark as Bought
            </button>
          )}
          {status === 'Bought' && (
            <button onClick={handleMarkPending} className="btn-warning btn-small" disabled={loading}>
              ⏳ Mark as Pending
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
