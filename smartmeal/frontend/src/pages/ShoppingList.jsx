import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ShoppingAPI from '../services/shoppingApi';
import ShoppingForm from '../components/ShoppingForm';
import StatsSection from '../components/StatsSection';
import FilterSection from '../components/FilterSection';
import ShoppingTable from '../components/ShoppingTable';
import ShoppingChart from '../components/ShoppingChart';
import Toast from '../components/Toast';
import EditItemForm from '../components/EditItemForm';

function ShoppingList() {
  const { user } = useContext(AuthContext);
  // Backend returns id as _id (Pydantic alias). Firebase users have uid.
  const userId = user?.uid || user?.id || user?._id || '';

  // ── State ─────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0, pending: 0, bought: 0,
    source_breakdown: { manual: 0, meal_plan: 0 },
  });
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingItemId, setEditingItemId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type });
  const showAddView  = () => setCurrentView('add');
  const showListView = (reload = false) => {
    setCurrentView('list');
    setEditingItemId(null);
    if (reload) loadItems();
  };
  const showEditView = (itemId) => { setEditingItemId(itemId); setCurrentView('edit'); };

  // ── Data ──────────────────────────────────────────────────────────────────
  const loadStats = async () => {
    if (!userId) return;
    try { setStats(await ShoppingAPI.getStats(userId)); }
    catch (e) { console.error('Stats error:', e); }
  };

  const loadItems = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setItems(await ShoppingAPI.getItems(userId, statusFilter));
      await loadStats();
    } catch (e) {
      console.error('Load error:', e);
      showToast('Failed to connect to server', 'error');
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadItems(); }, [userId, statusFilter]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addItem = async (itemData) => {
    try {
      await ShoppingAPI.addItem({ ...itemData, user_id: userId });
      showToast(`"${itemData.item_name}" added!`, 'success');
      showListView();
      loadItems();
      return true;
    } catch (e) {
      showToast(e.message || 'Failed to add item', 'error');
      return false;
    }
  };

  // Navigate to edit view (inline editing not used)
  const updateItem = (itemId) => { showEditView(itemId); return true; };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return false;
    try {
      await ShoppingAPI.deleteItem(itemId);
      showToast('Item deleted', 'success');
      loadItems();
      return true;
    } catch (e) {
      showToast(e.message || 'Failed to delete item', 'error');
      return false;
    }
  };

  const markAsBought = async (itemId) => {
    try {
      await ShoppingAPI.markBought(itemId);
      showToast('Marked as bought!', 'success');
      loadItems();
      return true;
    } catch (e) {
      showToast(e.message || 'Failed to update item', 'error');
      return false;
    }
  };

  const clearBoughtItems = async () => {
    if (!window.confirm('Clear all bought items?')) return;
    try {
      const result = await ShoppingAPI.clearBought(userId);
      showToast(result.message, 'success');
      loadItems();
    } catch {
      showToast('Failed to clear bought items', 'error');
    }
  };

  const filteredItems = statusFilter
    ? items.filter(item => item.status === statusFilter)
    : items;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="shopping-page">
      <div className="shopping-page-header">
        <h1>🛒 Shopping List</h1>
        <p className="text-muted">Your personal grocery planning assistant</p>
      </div>

      {/* LIST VIEW */}
      {currentView === 'list' && (
        <div>
          <div className="shopping-add-btn-wrap">
            <button onClick={showAddView} className="btn-primary shopping-add-btn">
              ➕ Add New Item
            </button>
          </div>

          <StatsSection stats={stats} />

          <FilterSection
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
            onClearBought={clearBoughtItems}
          />

          <ShoppingTable
            items={filteredItems}
            loading={loading}
            onMarkBought={markAsBought}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
          />

          <ShoppingChart stats={stats} />
        </div>
      )}

      {/* ADD VIEW */}
      {currentView === 'add' && (
        <div className="shopping-single-view">
          <button onClick={showListView} className="btn-secondary btn-small shopping-back-btn">
            ← Back to List
          </button>
          <h2>➕ Add New Item</h2>
          <ShoppingForm onAddItem={addItem} onCancel={showListView} />
        </div>
      )}

      {/* EDIT VIEW */}
      {currentView === 'edit' && (
        <div className="shopping-single-view">
          <button onClick={showListView} className="btn-secondary btn-small shopping-back-btn">
            ← Back to List
          </button>
          <h2>✏️ Edit Item</h2>
          <EditItemForm
            itemId={editingItemId}
            onSave={() => { showToast('Item updated!', 'success'); showListView(true); }}
            onCancel={() => showListView(false)}
            onDelete={() => { showToast('Item deleted', 'success'); showListView(true); }}
          />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default ShoppingList;
