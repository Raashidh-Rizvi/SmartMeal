
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ShoppingAPI from '../services/shoppingApi';
import { getUserId } from '../utils/userUtils';
import ShoppingForm from '../components/ShoppingForm';
import StatsSection from '../components/StatsSection';
import FilterSection from '../components/FilterSection';
import ShoppingTable from '../components/ShoppingTable';
import ShoppingChart from '../components/ShoppingChart';
import Toast from '../components/Toast';
import EditItemForm from '../components/EditItemForm';

function ShoppingList() {
  const { user } = useContext(AuthContext);
  const userId = getUserId(user);

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
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

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
    try { 
      const statsData = await ShoppingAPI.getStats(userId);
      console.log("📊 Stats loaded:", statsData);
      setStats(statsData); 
    }
    catch (e) { 
      console.error('❌ Stats error:', e); 
    }
  };

  const loadItems = async () => {
    if (!userId) {
      console.warn("❌ userId is not set, cannot load items");
      return;
    }
    setLoading(true);
    try {
      console.log("🔄 Loading shopping items for user:", userId, "Filter:", statusFilter || "none");
      const rawItems = await ShoppingAPI.getItems(userId, statusFilter);
      console.log("✅ Raw items from API:", rawItems);
      console.log(`📊 Total items returned: ${Array.isArray(rawItems) ? rawItems.length : 'NOT AN ARRAY'}`);
      
      if (!Array.isArray(rawItems)) {
        console.error("❌ API response is not an array:", rawItems);
        console.error("Response type:", typeof rawItems);
        setItems([]);
        setLoading(false);
        return;
      }
      
      if (rawItems.length === 0) {
        console.log("ℹ️  API returned 0 items. Shopping list is empty.");
        setItems([]);
        setLoading(false);
        await loadStats();
        return;
      }
      
      // Transform backend response to match ShoppingTable expectations
      const transformedItems = rawItems.map((item, idx) => {
        console.log(`Transforming item ${idx + 1}/${rawItems.length}:`, item);
        
        // Handle different date formats from backend
        let dateValue = item.created_at;
        if (!dateValue && item.date) {
          dateValue = item.date;
        }
        
        const transformed = {
          id: item._id || item.id,
          _id: item._id || item.id,
          item_name: item.name || item.item_name,
          name: item.name || item.item_name,
          quantity: item.quantity || 1,
          unit: item.unit || "",
          source: item.category === 'ingredient' ? 'Meal Plan' : 'Manual',
          category: item.category || "",
          status: item.status === 'pending' ? 'Pending' : item.status === 'bought' ? 'Bought' : item.status,
          created_at: dateValue,
          notes: item.notes || "",
        };
        console.log(`✅ Item ${idx + 1} transformed:`, transformed);
        return transformed;
      });
      
      console.log("📊 Total transformed items:", transformedItems.length);
      console.log("📝 All transformed items:", transformedItems);
      setItems(transformedItems);
      await loadStats();
    } catch (e) {
      console.error('❌ Load error:', e);
      console.error("Error message:", e.message);
      console.error("Full error:", e);
      showToast('Failed to connect to server: ' + (e.message || 'Unknown error'), 'error');
      setItems([]);
    }
    setLoading(false);
  };

  // Load items on mount and when filters change
  useEffect(() => { 
    console.log("📋 useEffect triggered for filter change, statusFilter:", statusFilter);
    loadItems(); 
  }, [statusFilter]);

  // Initial load on component mount
  useEffect(() => {
    console.log("🛒 Component mounted, userId:", userId);
    loadItems();
  }, [userId]);

  // ── Auto-refresh shopping list every 5 seconds ──────────────────────────
  // This ensures items added from the Meals page appear automatically
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing shopping list...");
      loadItems();
    }, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(interval);
      console.log("🛑 Stopped auto-refresh");
    };
  }, [statusFilter]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addItem = async (itemData) => {
    try {
      await ShoppingAPI.addItem({ ...itemData, user_id: userId });
      showToast(`"${itemData.name || itemData.item_name}" added!`, 'success');
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
            <button onClick={loadItems} className="btn-secondary shopping-add-btn" title="Refresh shopping list">
              🔄 Refresh
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
