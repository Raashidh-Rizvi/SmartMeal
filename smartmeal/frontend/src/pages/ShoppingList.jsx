import React, { useState, useEffect, useContext, useCallback } from 'react';
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
import { 
  ShoppingBasket, 
  Plus, 
  RefreshCw, 
  ArrowLeft, 
  Pencil, 
  ShoppingCart,
  UtensilsCrossed,
  ChefHat,
  Flame,
  Leaf
} from 'lucide-react';

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
  const loadStats = useCallback(async () => {
    if (!userId) return;
    try { 
      const statsData = await ShoppingAPI.getStats(userId);
      console.log("📊 Stats loaded:", statsData);
      setStats(statsData); 
    }
    catch (e) { 
      console.error('❌ Stats error:', e); 
    }
  }, [userId]);

  const loadItems = useCallback(async () => {
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
          source: (item.source || '').toLowerCase().includes('meal') ? 'Meal Plan' : 'Manual',
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
  }, [userId, statusFilter, loadStats]);

  // Initial load on component mount
  useEffect(() => {
    console.log("🛒 Component mounted or loadItems changed");
    loadItems();
  }, [loadItems]);

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
  }, [loadItems]);

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
      <div className="page-hero">
        {/* Decorative Background Icons - Scattered */}
        <UtensilsCrossed size={48} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '15%', left: '8%', '--rotation': '-18deg' }} />
        <ChefHat size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '10%', left: '42%', '--rotation': '12deg', animationDelay: '0.8s' }} />
        <Flame size={44} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '25%', '--rotation': '22deg', animationDelay: '1.5s' }} />
        <Leaf size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '12%', right: '12%', '--rotation': '-8deg', animationDelay: '2.3s' }} />

        <ShoppingBasket size={48} color="#10b981" strokeWidth={1.75} style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Shopping List</h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>Your personal grocery planning assistant</p>
        </div>
      </div>

      {/* LIST VIEW */}
      {currentView === 'list' && (
        <div>
          <div className="shopping-add-btn-wrap" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button onClick={showAddView} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Add New Item
            </button>
            <button onClick={loadItems} className="btn-secondary" title="Refresh shopping list" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} className={loading ? 'spinner' : ''} /> Refresh
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
        <div className="shopping-single-view card" style={{ padding: '2rem' }}>
          <button onClick={showListView} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', width: 'fit-content' }}>
            <ArrowLeft size={16} /> Back to List
          </button>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Plus size={24} color="var(--primary)" /> Add New Item
          </h2>
          <ShoppingForm onAddItem={addItem} onCancel={showListView} />
        </div>
      )}

      {/* EDIT VIEW */}
      {currentView === 'edit' && (
        <div className="shopping-single-view card" style={{ padding: '2rem' }}>
          <button onClick={showListView} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', width: 'fit-content' }}>
            <ArrowLeft size={16} /> Back to List
          </button>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Pencil size={24} color="var(--primary)" /> Edit Item
          </h2>
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
