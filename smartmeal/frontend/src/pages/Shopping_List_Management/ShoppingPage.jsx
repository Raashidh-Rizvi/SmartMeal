/**
 * ShoppingPage
 * Root page component that wires together all sub-components and
 * manages application-level state (items, stats, filters, toasts).
 *
 * Depends on:
 *   - ShoppingAPI  (src/services/api.js)
 *   - ShoppingForm (src/components/ShoppingForm.jsx)
 *   - StatsSection (src/components/StatsSection.jsx)
 *   - FilterSection(src/components/FilterSection.jsx)
 *   - ShoppingTable(src/components/ShoppingTable.jsx)
 *   - ShoppingChart(src/components/ShoppingChart.jsx)
 *   - Toast        (src/components/Toast.jsx)
 */

function ShoppingPage() {
  const { useState, useEffect } = React;

  // ── State ────────────────────────────────────────────────────────────────
  const [user_id, setUser_id]           = useState('user123');
  const [items, setItems]             = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    bought: 0,
    source_breakdown: { manual: 0, meal_plan: 0 }
  });
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'edit'
  const [editingItemId, setEditingItemId] = useState(null);
  const [status_filter, setStatusFilter] = useState('');
  const [loading, setLoading]           = useState(false);
  const [toast, setToast]               = useState(null);

  // ── UI handlers ────────────────────────────────────────────────────────────
  const showAddView = () => {
    setCurrentView('add');
  };

  const showEditView = (itemId) => {
    setEditingItemId(itemId);
    setCurrentView('edit');
  };

  const showListView = () => {
    setCurrentView('list');
    setEditingItemId(null);
  };

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Load on user_id change ────────────────────────────────────────────────
  useEffect(() => { loadItems(); }, [user_id]);

  // ── Data fetching ────────────────────────────────────────────────────────
  const loadItems = async () => {
    if (!user_id.trim()) return;
    setLoading(true);
    try {
      const data = await ShoppingAPI.getItems(user_id, status_filter);
      setItems(data);
      await loadStats();
    } catch (error) {
      console.error('Error loading items:', error);
      showToast('Failed to connect to server', 'error');
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!user_id.trim()) return;
    try {
      const data = await ShoppingAPI.getStats(user_id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const addItem = async (itemData) => {
    try {
      await ShoppingAPI.addItem({ ...itemData, user_id });
      showToast(`Item "${itemData.item_name}" added successfully!`, 'success');
      showListView(); // Return to list view after adding
      loadItems();
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      showToast(error.message || 'Failed to add item', 'error');
      return false;
    }
  };

  const updateItem = async (itemId, updateData) => {
    // Navigate to edit view instead of inline editing
    showEditView(itemId);
    return true;
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return false;
    try {
      await ShoppingAPI.deleteItem(itemId);
      showToast('Item deleted successfully!', 'success');
      loadItems();
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast(error.message || 'Failed to delete item', 'error');
      return false;
    }
  };

  const markAsBought = async (itemId) => {
    try {
      await ShoppingAPI.markBought(itemId);
      showToast('Item marked as bought!', 'success');
      loadItems();
      return true;
    } catch (error) {
      console.error('Error marking item:', error);
      showToast(error.message || 'Failed to update item', 'error');
      return false;
    }
  };

  const clearBoughtItems = async () => {
    if (!window.confirm('Are you sure you want to clear all bought items?')) return;
    try {
      const result = await ShoppingAPI.clearBought(user_id);
      showToast(result.message, 'success');
      loadItems();
    } catch (error) {
      console.error('Error clearing items:', error);
      showToast('Failed to clear bought items', 'error');
    }
  };

  // ── Filtered list ────────────────────────────────────────────────────────
  const filteredItems = status_filter
    ? items.filter(item => item.status === status_filter)
    : items;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="shopping-page">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-content">
          <h1>🛒 Shopping List Manager</h1>
          <p className="tagline">Your Personal Grocery Planning Assistant</p>
        </div>
        <div className="user-section">
          <input
            type="text"
            id="user_id"
            placeholder="Enter User ID"
            value={user_id}
            onChange={(e) => setUser_id(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadItems()}
          />
          <button onClick={loadItems} className="btn-primary">Load List</button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="main-content">

        {/* LIST VIEW */}
        {currentView === 'list' && (
          <div>
            {/* Add Item Button */}
            <section className="card add-item-button-card">
              <div className="card-body">
                <button onClick={showAddView} className="btn-primary btn-large btn-add-item">
                  ➕ Add New Item
                </button>
                <p className="button-description">Click to add items to your shopping list</p>
              </div>
            </section>

            {/* Stats Cards */}
            <StatsSection stats={stats} />

            {/* Filter + Action Buttons */}
            <FilterSection
              statusFilter={status_filter}
              onFilterChange={setStatusFilter}
              onClearBought={clearBoughtItems}
            />

            {/* Shopping List Table */}
            <ShoppingTable
              items={filteredItems}
              loading={loading}
              onMarkBought={markAsBought}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
            />

            {/* Charts */}
            <ShoppingChart stats={stats} />
          </div>
        )}

        {/* ADD VIEW */}
        {currentView === 'add' && (
          <div className="single-view-container">
            <div className="view-header">
              <button onClick={showListView} className="btn-back">← Back to List</button>
              <h2>➕ Add New Item</h2>
            </div>
            <ShoppingForm onAddItem={addItem} onCancel={showListView} />
          </div>
        )}

        {/* EDIT VIEW */}
        {currentView === 'edit' && (
          <div className="single-view-container">
            <div className="view-header">
              <button onClick={showListView} className="btn-back">← Back to List</button>
              <h2>✏️ Edit Item</h2>
            </div>
            <EditItemForm 
              itemId={editingItemId} 
              onSave={showListView}
              onCancel={showListView}
              onDelete={showListView}
            />
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="app-footer">
        <p>Shopping List Management System</p>
      </footer>

      {/* ── Toast Notification ── */}
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
