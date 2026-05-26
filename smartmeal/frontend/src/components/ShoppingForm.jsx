/**
 * ShoppingForm Component
 * Handles adding new items to the shopping list
 */
import React, { useState } from 'react';

function ShoppingForm({ onAddItem, onCancel }) {
  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity] = useState(1);
<<<<<<< HEAD
  const [unit, setUnit] = useState('piece');
=======
  const [unit, setUnit] = useState('pcs');
  const UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs', 'Piece', 'Pack', 'Dozen', 'slice', 'bottle', 'jar', 'cup', 'tbsp', 'tsp', 'pinch'];
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  const [source, setSource] = useState('Manual');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item_name.trim()) return;

    const success = await onAddItem({
<<<<<<< HEAD
      item_name: item_name.trim(),
      quantity: parseFloat(quantity),
      unit,
      source,
=======
      name: item_name.trim(),
      quantity: parseFloat(quantity),
      unit,
      source: source === 'MealPlan' ? 'meal plan' : 'manual',
      notes: source === 'MealPlan' ? `From meal plan` : '',
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    });

    if (success) {
      set_item_name('');
      setQuantity(1);
<<<<<<< HEAD
      setUnit('piece');
=======
      setUnit('pcs');
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
      setSource('Manual');
    }
  };

  return (
    <section className="card add-item-card">
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
            />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
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
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="Manual">Manual</option>
              <option value="MealPlan">Meal Plan</option>
            </select>
          </div>
          <div className="shopping-form-actions">
            <button type="submit" className="btn-primary">Add Item</button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

export default ShoppingForm;
