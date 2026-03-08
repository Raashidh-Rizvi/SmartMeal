/**
 * ShoppingForm Component
 * Handles adding new items to the shopping list
 */

function ShoppingForm({ onAddItem, onCancel }) {
  const { useState } = React;

  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piece');
  const [source, setSource] = useState('Manual');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item_name.trim()) return;

    const success = await onAddItem({
      item_name: item_name.trim(),
      quantity: parseFloat(quantity),
      unit,
      source
    });

    if (success) {
      set_item_name('');
      setQuantity(1);
      setUnit('piece');
      setSource('Manual');
    }
  };

  return (
    <section className="card add-item-card">
      <div className="card-header">
        <h2>➕ Add New Item</h2>
      </div>
      <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Item Name</label>
              <input
                type="text"
                value={item_name}
                onChange={(e) => set_item_name(e.target.value)}
                placeholder="e.g., Rice, Milk, Eggs"
                required
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px', marginBottom: '1rem'}}
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.1"
                step="0.1"
                required
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px', marginBottom: '1rem'}}
              />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select 
                value={unit} 
                onChange={(e) => setUnit(e.target.value)}
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px', backgroundColor: 'white', marginBottom: '1rem'}}
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
                style={{width: '100%', padding: '12px', border: '2px solid #28a745', borderRadius: '8px', fontSize: '16px', backgroundColor: 'white', marginBottom: '1rem'}}
              >
                <option value="Manual">Manual</option>
                <option value="MealPlan">Meal Plan</option>
              </select>
            </div>
            <div className="form-group btn-group" style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
              <button 
                type="submit" 
                className="btn-add"
                style={{flex: 1, padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'}}
              >
                Add Item
              </button>
              {onCancel && (
                <button 
                  type="button" 
                  onClick={onCancel} 
                  className="btn-cancel"
                  style={{flex: 1, padding: '12px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'}}
                >
                  Cancel
                </button>
              )}
            </div>
        </div>
          </form>
      </div>
    </section>
  );
}
