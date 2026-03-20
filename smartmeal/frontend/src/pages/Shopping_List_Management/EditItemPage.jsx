import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingAPI } from '../../api/axios';
import Toast from '../../components/Toast';

function EditItemPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  
  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piece');
  const [source, setSource] = useState('Manual');
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);
  const [originalItem, setOriginalItem] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadItem = async () => {
    if (!itemId) return;
    
    setFetching(true);
    try {
      // Get all items and find the one we need
      const items = await ShoppingAPI.getItems('user123');
      const item = items.find(i => (i.id || i._id) === itemId);
      
      if (item) {
        setOriginalItem(item);
        set_item_name(item.item_name || '');
        setQuantity(item.quantity || 1);
        setUnit(item.unit || 'piece');
        setSource(item.source || 'Manual');
        setStatus(item.status || 'Pending');
      } else {
        showToast('Item not found', 'error');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading item:', error);
      showToast('Failed to load item', 'error');
      navigate('/');
    }
    setFetching(false);
  };

  // Load item data on mount
  useEffect(() => {
    loadItem();
  }, [itemId]);


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
        status
      });
      showToast('Item updated successfully!', 'success');
      navigate('/');
    } catch (error) {
      console.error('Error updating item:', error);
      showToast(error.message || 'Failed to update item', 'error');
    }
    setLoading(false);
  };

  const goBack = () => {
    navigate('/');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setLoading(true);
    try {
      await ShoppingAPI.deleteItem(itemId);
      showToast('Item deleted successfully!', 'success');
      navigate('/');
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
          <button onClick={goBack} className="btn-back">← Back to List</button>
          <h1>✏️ Edit Item</h1>
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
                      <option value="piece">Piece</option>
                      <option value="kg">Kg</option>
                      <option value="g">Grams</option>
                      <option value="L">Liter</option>
                      <option value="ml">ML</option>
                      <option value="pack">Pack</option>
                      <option value="dozen">Dozen</option>
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
            <div className="card-header">
              <h3>⚡ Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="action-buttons">
                {status === 'Pending' && (
                  <button
                    onClick={handleMarkBought}
                    className="btn-success"
                    disabled={loading}
                  >
                    ✓ Mark as Bought
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                  disabled={loading}
                >
                  🗑 Delete Item
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

export default EditItemPage;
