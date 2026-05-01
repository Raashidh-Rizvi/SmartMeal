import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ShoppingAPI from '../../services/shoppingApi';
import ShoppingForm from '../../components/ShoppingForm';
import StatsSection from '../../components/StatsSection';
import FilterSection from '../../components/FilterSection';
import ShoppingTable from '../../components/ShoppingTable';
import ShoppingChart from '../../components/ShoppingChart';
import EditItemForm from '../../components/EditItemForm';
import Toast from '../../components/Toast';
import { Plus, PlusCircle, Share2, Edit3, ArrowLeft, ShoppingCart, List, PlusSquare, CheckSquare, UtensilsCrossed, ChefHat, Flame, Leaf, Tag } from 'lucide-react';

function ShoppingPage() {

  // ── Get authenticated user ────────────────────────────────────────────────
  const { user } = useContext(AuthContext);
  const user_id = user?._id || user?.id || '1';  // Use actual user ID, fallback to '1'

  // ── State ────────────────────────────────────────────────────────────────
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
  const [source_filter, setSourceFilter] = useState('');
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

  // ── Data fetching ────────────────────────────────────────────────────────
  const loadStats = async () => {
    if (!user_id.trim()) return;
    try {
      const data = await ShoppingAPI.getStats(user_id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadItems = async () => {
    if (!user_id.trim()) return;
    setLoading(true);
    try {
      const data = await ShoppingAPI.getItems(user_id, status_filter, source_filter);
      setItems(data);
      await loadStats();
    } catch (error) {
      console.error('Error loading items:', error);
      showToast('Failed to connect to server', 'error');
    }
    setLoading(false);
  };

  // ── Load on filters change ─────────────────────────────────────────────────
  useEffect(() => { loadItems(); }, [user_id, status_filter, source_filter]);


  // ── CRUD handlers ────────────────────────────────────────────────────────
  const addItem = async (itemData) => {
    try {
      await ShoppingAPI.addItem({ ...itemData, user_id });
      showToast(`Item "${itemData.name}" added successfully!`, 'success');
      showListView(); // Return to list view after adding
      loadItems();
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      showToast(error.message || 'Failed to add item', 'error');
      return false;
    }
  };

  const updateItem = async (itemId) => {
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
    ? items.filter(item => (item.status || '').toLowerCase() === status_filter.toLowerCase())
    : items;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="shopping-page">
      {/* Page Header */}
      <div className="page-hero page-hero--sub">
        {/* Premium Decorative Background Icons - Scattered Artistically */}
        <UtensilsCrossed size={70} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '15%', left: '5%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <ChefHat size={82} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '75%', left: '25%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <Flame size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '20%', left: '10%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <Leaf size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '10%', right: '15%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        
        <ShoppingCart size={62} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '55%', right: '5%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <List size={66} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '15%', right: '12%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <PlusSquare size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '35%', right: '28%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <Tag size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '35%', left: '22%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <ShoppingCart size={48} color="#10b981" strokeWidth={1.75} style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Shopping List</h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>Plan, track, and manage everything you need to buy</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="shopping-content-area">

        {/* LIST VIEW */}
        {currentView === 'list' && (
          <div>
            {/* Add Item Button */}
            <section className="card add-item-button-card">
              <div className="card-body">
                <button onClick={showAddView} className="btn-primary btn-large btn-add-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', margin: '0 auto' }}>
                  <Plus size={20} /> Add New Item
                </button>
                <p className="button-description">Click to add items to your shopping list</p>
              </div>
            </section>

            {/* Stats Cards */}
            <StatsSection stats={stats} />

            {/* Filter + Action Buttons */}
            <FilterSection
              statusFilter={status_filter}
              sourceFilter={source_filter}
              onStatusChange={setStatusFilter}
              onSourceChange={setSourceFilter}
              onClearBought={clearBoughtItems}
            />

            {/* Share List Button */}
            <button
              onClick={() => {
                const text = filteredItems.map(i => `${i.name} ${i.quantity}${i.unit} (${i.source})`).join('\n');
                const a = document.createElement('a');
                a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
                a.download = 'shopping-list.txt';
                a.click();
              }}
              className="btn-secondary ml-2"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.6rem 1.2rem', marginBottom: '1.5rem' }}
            >
              <Share2 size={18} /> Share List
            </button>

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
              <button onClick={showListView} className="btn-back" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18} /> Back to List
              </button>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <PlusCircle size={28} color="var(--primary)" /> Add New Item
              </h2>
            </div>
            <ShoppingForm onAddItem={addItem} onCancel={showListView} />
          </div>
        )}

        {/* EDIT VIEW */}
        {currentView === 'edit' && (
          <div className="single-view-container">
            <div className="view-header">
              <button onClick={showListView} className="btn-back" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18} /> Back to List
              </button>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Edit3 size={28} color="var(--primary)" /> Edit Item
              </h2>
            </div>
            <EditItemForm 
              itemId={editingItemId} 
              user_id={user_id}
              onSave={() => { showListView(); loadItems(); }}
              onCancel={showListView}
              onDelete={() => { showListView(); loadItems(); }}
            />
          </div>
        )}

      </div>

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

export default ShoppingPage;
