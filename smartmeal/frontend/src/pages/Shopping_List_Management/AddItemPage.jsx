import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingAPI } from '../../api/axios';
import Toast from '../../components/Toast';
import { ArrowLeft, PlusCircle, Zap } from 'lucide-react';

function AddItemPage() {
  const navigate = useNavigate();
  
  const [item_name, set_item_name] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');

  const UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs', 'Piece', 'Pack', 'Dozen', 'slice', 'bottle', 'jar', 'cup', 'tbsp', 'tsp', 'pinch'];
  const [source, setSource] = useState('Manual');
  const [user_id] = useState('user123');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item_name.trim()) return;

    setLoading(true);
    try {
      await ShoppingAPI.addItem({
        name: item_name.trim(),
        quantity: parseFloat(quantity),
        unit,
        source,
        user_id
      });
      showToast(`Item "${item_name}" added successfully!`, 'success');
      
      // Reset form
      set_item_name('');
      setQuantity(1);
      setUnit('piece');
      setSource('Manual');
    } catch (error) {
      console.error('Error adding item:', error);
      showToast(error.message || 'Failed to add item', 'error');
    }
    setLoading(false);
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <div className="add-item-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <button onClick={goBack} className="btn-back" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Back to List
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PlusCircle size={32} /> Add New Item
          </h1>
          <p>Add items to your shopping list</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="add-item-container">
          <section className="card add-item-card">
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
                      <option value="">Select unit</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
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

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary btn-large"
                    disabled={loading || !item_name.trim()}
                  >
                    {loading ? 'Adding...' : 'Add Item'}
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

          {/* Quick Actions */}
          <section className="card quick-actions-card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Zap size={20} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="quick-actions">
                <button
                  onClick={() => {
                    set_item_name('Milk');
                    setQuantity(1);
                    setUnit('L');
                  }}
                  className="btn-quick"
                >
                  Add Milk
                </button>
                <button
                  onClick={() => {
                    set_item_name('Rice');
                    setQuantity(1);
                    setUnit('kg');
                  }}
                  className="btn-quick"
                >
                  Add Rice
                </button>
                <button
                  onClick={() => {
                    set_item_name('Eggs');
                    setQuantity(12);
                    setUnit('pcs');
                  }}
                  className="btn-quick"
                >
                  Add Eggs
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

export default AddItemPage;
