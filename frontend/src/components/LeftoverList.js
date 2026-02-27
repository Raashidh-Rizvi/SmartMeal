import React, { useState } from 'react';
import { leftoverService } from '../services/leftoverService';
import { notify } from '../utils/notifications';
import { getFoodImage } from '../services/imageService';

const LeftoverList = ({ leftovers, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const handleMarkUsed = async (id) => {
    try {
      await leftoverService.markUsed(id);
      notify.success('Leftover marked as used!');
      onUpdate();
    } catch (error) {
      console.error('Error marking leftover as used:', error);
      notify.error('Failed to mark as used');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leftover?')) {
      try {
        await leftoverService.delete(id);
        notify.success('Leftover deleted successfully!');
        onUpdate();
      } catch (error) {
        console.error('Error deleting leftover:', error);
        notify.error('Failed to delete leftover');
      }
    }
  };

  const handleEdit = (leftover) => {
    setEditingId(leftover.id);
    setEditForm({
      quantity: leftover.quantity,
      notes: leftover.notes || ''
    });
  };

  const handleUpdate = async (id) => {
    try {
      await leftoverService.update(id, editForm);
      notify.success('Leftover updated successfully!');
      setEditingId(null);
      onUpdate();
    } catch (error) {
      notify.error('Failed to update leftover');
    }
  };

  const getExpiryClass = (days) => {
    if (days < 0) return 'danger';
    if (days <= 2) return 'warning';
    return 'safe';
  };

  const getItemClass = (leftover) => {
    if (leftover.is_used) return 'leftover-item used';
    if (leftover.days_until_expiry < 0) return 'leftover-item expired';
    if (leftover.days_until_expiry <= 2) return 'leftover-item expiring-soon';
    return 'leftover-item';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="leftover-list">
      {leftovers.map((leftover) => (
        <div key={leftover.id} className={getItemClass(leftover)}>
          <img 
            src={leftover.image_url || getFoodImage(leftover.name)} 
            alt={leftover.name}
            className="leftover-image"
            onError={(e) => e.target.style.display = 'none'}
          />
          <div className="leftover-info">
            <div>
              <h3>{leftover.name}</h3>
              <div style={{ marginTop: '8px' }}>
                <span className={`badge badge-${leftover.storage_location}`}>
                  {leftover.storage_location === 'fridge' ? '🧊' : '❄️'} {leftover.storage_location}
                </span>
                {leftover.is_used && <span className="badge badge-used">✓ Used</span>}
                {!leftover.is_used && leftover.days_until_expiry <= 2 && leftover.days_until_expiry >= 0 && (
                  <span className="badge badge-expiring">⚠️ Expiring Soon</span>
                )}
                {!leftover.is_used && leftover.days_until_expiry < 0 && (
                  <span className="badge badge-expired">❌ Expired</span>
                )}
              </div>
            </div>

            <div className="leftover-meta">
              <div className="meta-item">
                <strong>Quantity:</strong> {leftover.quantity}
              </div>
              <div className="meta-item">
                <strong>Category:</strong> {leftover.category}
              </div>
              <div className="meta-item">
                <strong>Cooked:</strong> {formatDate(leftover.cooked_date)}
              </div>
              <div className="meta-item">
                <strong>Expires:</strong> {formatDate(leftover.expiry_date)}
              </div>
            </div>

            {leftover.notes && (
              <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                📝 {leftover.notes}
              </div>
            )}

            {editingId === leftover.id ? (
              <div style={{ marginTop: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600', color: '#4caf50' }}>Quantity</label>
                  <input
                    type="text"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600', color: '#4caf50' }}>Notes</label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
            ) : null}

            <div className={`expiry-info ${getExpiryClass(leftover.days_until_expiry)}`}>
              {leftover.days_until_expiry < 0
                ? `Expired ${Math.abs(leftover.days_until_expiry)} days ago`
                : leftover.days_until_expiry === 0
                ? '⚠️ Expires today!'
                : `${leftover.days_until_expiry} days remaining`}
            </div>
          </div>

          <div className="leftover-actions">
            {editingId === leftover.id ? (
              <>
                <button onClick={() => handleUpdate(leftover.id)} className="btn btn-success">
                  ✔️ Save
                </button>
                <button onClick={() => setEditingId(null)} className="btn btn-secondary">
                  ❌ Cancel
                </button>
              </>
            ) : (
              <>
                {!leftover.is_used && (
                  <>
                    <button onClick={() => handleEdit(leftover)} className="btn btn-primary">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleMarkUsed(leftover.id)} className="btn btn-success">
                      ✓ Mark Used
                    </button>
                  </>
                )}
                <button onClick={() => handleDelete(leftover.id)} className="btn btn-danger">
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeftoverList;
