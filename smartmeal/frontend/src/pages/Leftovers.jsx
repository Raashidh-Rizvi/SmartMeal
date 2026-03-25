import React, { useState, useEffect } from 'react';
import { leftoverService } from '../services/leftoverService';
import { notify } from '../utils/notifications';
import { getFoodImage } from '../services/imageService';

function Leftovers() {
  const [leftovers, setLeftovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [includeUsed, setIncludeUsed] = useState(false);
  const [toast, setToast] = useState(null);

  const emptyForm = {
    name: '', quantity: '', category: '',
    cooked_date: '', expiry_date: '',
    storage_location: 'fridge', notes: ''
  };
  const [formData, setFormData] = useState(emptyForm);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLeftovers = async () => {
    try {
      setLoading(true);
      const res = await leftoverService.getAll(includeUsed);
      setLeftovers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeftovers(); }, [includeUsed]);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        cooked_date: new Date(item.cooked_date).toISOString().slice(0, 16),
        expiry_date: new Date(item.expiry_date).toISOString().slice(0, 16),
        storage_location: item.storage_location,
        notes: item.notes || ''
      });
    } else {
      setEditingItem(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cooked_date: new Date(formData.cooked_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        image_url: getFoodImage(formData.name)
      };
      if (editingItem) {
        await leftoverService.update(editingItem.id, payload);
        showToast('success', 'Leftover updated!');
      } else {
        await leftoverService.create(payload);
        showToast('success', 'Leftover added!');
      }
      setShowModal(false);
      fetchLeftovers();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to save leftover');
    }
  };

  const handleMarkUsed = async (id) => {
    try {
      await leftoverService.markUsed(id);
      showToast('success', 'Marked as used!');
      fetchLeftovers();
    } catch { showToast('error', 'Failed to mark as used'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leftover?')) return;
    try {
      await leftoverService.delete(id);
      showToast('success', 'Deleted successfully!');
      fetchLeftovers();
    } catch { showToast('error', 'Failed to delete'); }
  };

  const getExpiryBadge = (days, isUsed) => {
    if (isUsed) return <span className="badge badge-user">✓ Used</span>;
    if (days < 0) return <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}>Expired</span>;
    if (days <= 2) return <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>⚠️ Expiring Soon</span>;
    return <span className="badge badge-admin">{days}d left</span>;
  };

  const stats = {
    total: leftovers.length,
    expiring: leftovers.filter(l => !l.is_used && l.days_until_expiry >= 0 && l.days_until_expiry <= 2).length,
    expired: leftovers.filter(l => !l.is_used && l.days_until_expiry < 0).length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-section" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: '🍽️', label: 'Total Items', value: stats.total },
          { icon: '⚠️', label: 'Expiring Soon', value: stats.expiring },
          { icon: '❌', label: 'Expired', value: stats.expired },
        ].map(({ icon, label, value }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-info">
              <h3>{label}</h3>
              <p className="stat-value">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Leftover Tracker</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Track your leftover food and reduce waste.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeUsed} onChange={e => setIncludeUsed(e.target.checked)} />
              Show used
            </label>
            <button onClick={() => openModal()} className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
              + Add Leftover
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="loading">Loading leftovers...</p>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Storage</th>
                  <th>Cooked</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leftovers.length === 0 ? (
                  <tr><td colSpan="8" className="empty-message">No leftovers tracked yet. Add your first one!</td></tr>
                ) : leftovers.map(item => (
                  <tr key={item.id} className={item.days_until_expiry < 0 && !item.is_used ? 'row-danger' : ''}>
                    <td><strong>{item.name}</strong>{item.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.notes}</div>}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                    <td>{item.storage_location === 'fridge' ? '🧊 Fridge' : item.storage_location === 'freezer' ? '❄️ Freezer' : '🏠 Room'}</td>
                    <td>{new Date(item.cooked_date).toLocaleDateString()}</td>
                    <td>{new Date(item.expiry_date).toLocaleDateString()}</td>
                    <td>{getExpiryBadge(item.days_until_expiry, item.is_used)}</td>
                    <td>
                      <div className="action-buttons">
                        {!item.is_used && (
                          <>
                            <button onClick={() => openModal(item)} className="btn-icon">Edit</button>
                            <span style={{ color: 'var(--text-muted)' }}>|</span>
                            <button onClick={() => handleMarkUsed(item.id)} className="btn-icon">✓ Used</button>
                            <span style={{ color: 'var(--text-muted)' }}>|</span>
                          </>
                        )}
                        <button onClick={() => handleDelete(item.id)} className="btn-icon text-danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingItem ? '✏️ Edit Leftover' : '🍽️ Add Leftover'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Food Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Chicken Curry" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="text" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="e.g., 2 servings" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Main Course" required />
                </div>
                <div className="form-group">
                  <label>Cooked Date</label>
                  <input type="datetime-local" value={formData.cooked_date} onChange={e => setFormData({ ...formData, cooked_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="datetime-local" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Storage Location</label>
                <select value={formData.storage_location} onChange={e => setFormData({ ...formData, storage_location: e.target.value })}>
                  <option value="fridge">🧊 Fridge</option>
                  <option value="freezer">❄️ Freezer</option>
                  <option value="room">🏠 Room</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional notes..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit">{editingItem ? 'Update' : 'Add Leftover'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default Leftovers;
