/**
 * EditItemForm Component
 * Dedicated form for editing existing shopping items
 */

function EditItemForm({ itemId, onSave, onCancel, onDelete }) {
  const { useState, useEffect } = React;

  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piece');
  const [source, setSource] = useState('Manual');
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [originalItem, setOriginalItem] = useState(null);

  // Load item data on mount
  useEffect(() => {
    loadItem();
  }, [itemId]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!'); // Debug log
    if (!item_name.trim()) {
      console.log('Item name is empty, not submitting');
      return;
    }

    console.log('Submitting with data:', {
      itemId,
      item_name: item_name.trim(),
      quantity: parseFloat(quantity),
      unit,
      source,
      status
    }); // Debug log
    
    setLoading(true);
    try {
      const result = await ShoppingAPI.updateItem(itemId, {
        item_name: item_name.trim(),
        quantity: parseFloat(quantity),
        unit,
        source,
        status
      });
      console.log('Update result:', result); // Debug log
      alert('Item updated successfully!');
      onSave();
    } catch (error) {
      console.error('Error updating item:', error);
      alert(error.message || 'Failed to update item');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setLoading(true);
    try {
      await ShoppingAPI.deleteItem(itemId);
      alert('Item deleted successfully!');
      onDelete();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(error.message || 'Failed to delete item');
    }
    setLoading(false);
  };

  const handleMarkBought = async () => {
    setLoading(true);
    try {
      await ShoppingAPI.markBought(itemId);
      alert('Item marked as bought!');
      setStatus('Bought');
    } catch (error) {
      console.error('Error marking item:', error);
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
    <section className="card edit-item-card" style={{border: '2px solid #28a745', boxShadow: '0 4px 12px rgba(40,167,69,0.3)'}}>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{marginBottom: '1.5rem'}}>
            <div className="form-group" style={{flex: 1}}>
              <label style={{fontWeight: 'bold', color: '#333', marginBottom: '8px', display: 'block'}}>Item Name</label>
              <input
                type="text"
                value={item_name}
                onChange={(e) => set_item_name(e.target.value)}
                placeholder="e.g., Rice, Milk, Eggs"
                required
                disabled={loading}
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px'}}
              />
            </div>
            <div className="form-group" style={{flex: 1, marginLeft: '1rem'}}>
              <label style={{fontWeight: 'bold', color: '#333', marginBottom: '8px', display: 'block'}}>Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                min="0.1"
                step="0.1"
                required
                disabled={loading}
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px'}}
              />
            </div>
          </div>

          <div className="form-row" style={{marginBottom: '1.5rem'}}>
            <div className="form-group" style={{flex: 1}}>
              <label style={{fontWeight: 'bold', color: '#333', marginBottom: '8px', display: 'block'}}>Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={loading}
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px', backgroundColor: 'white'}}
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
            <div className="form-group" style={{flex: 1, marginLeft: '1rem'}}>
              <label style={{fontWeight: 'bold', color: '#333', marginBottom: '8px', display: 'block'}}>Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={loading}
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px', backgroundColor: 'white'}}
              >
                <option value="Manual">Manual</option>
                <option value="MealPlan">Meal Plan</option>
              </select>
            </div>
          </div>

          <div className="form-row" style={{marginBottom: '2rem'}}>
            <div className="form-group" style={{flex: 1}}>
              <label style={{fontWeight: 'bold', color: '#333', marginBottom: '8px', display: 'block'}}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px', backgroundColor: 'white'}}
              >
                <option value="Pending">Pending</option>
                <option value="Bought">Bought</option>
              </select>
            </div>
            <div className="form-group" style={{flex: 1, marginLeft: '1rem'}}>
              <label style={{fontWeight: 'bold', color: '#333', marginBottom: '8px', display: 'block'}}>Created</label>
              <input
                type="text"
                value={originalItem ? new Date(originalItem.created_at).toLocaleDateString() : ''}
                disabled
                className="disabled-input"
                style={{width: '100%', padding: '12px', border: '2px solid #e9ecef', borderRadius: '8px', fontSize: '16px', backgroundColor: '#f8f9fa'}}
              />
            </div>
          </div>

          <div className="form-actions" style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #28a745'}}>
            <button
              type="submit"
              className="btn-primary btn-large"
              disabled={loading || !item_name.trim()}
              style={{cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.3s ease'}}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
              style={{cursor: 'pointer', backgroundColor: '#fd7e14', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.3s ease'}}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e8590c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#fd7e14'}
            >
              ❌ Cancel
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="action-buttons" style={{display: 'flex', gap: '1rem', marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #28a745'}}>
          {status === 'Pending' && (
            <button
              onClick={handleMarkBought}
              className="btn-success"
              disabled={loading}
              style={{cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.3s ease'}}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              ✓ Mark as Bought
            </button>
          )}
          <button
            onClick={handleDelete}
            className="btn-danger"
            disabled={loading}
            style={{cursor: 'pointer', backgroundColor: '#fd7e14', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.3s ease'}}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e8590c'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#fd7e14'}
          >
            🗑 Delete Item
          </button>
        </div>
      </div>
    </section>
  );
}
