import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';

const TYPE_META = {
  EXPIRING_FOOD:       { icon: '🥫', label: 'Expiring Ingredient' },
  EXPIRING_LEFTOVER:   { icon: '🍽️', label: 'Expiring Leftover' },
  BUDGET_WARNING:      { icon: '⚠️', label: 'Budget Warning' },
  BUDGET_OVER:         { icon: '🚨', label: 'Budget Exceeded' },
};

const getTypeMeta = (type = '') => {
  if (TYPE_META[type]) return TYPE_META[type];
  if (type.startsWith('MEAL_MISSING_INGREDIENTS')) return { icon: '🛒', label: 'Missing Ingredients' };
  if (type.startsWith('MEAL_REMINDER'))            return { icon: '📅', label: 'Meal Reminder' };
  return { icon: '🔔', label: type.replace(/_/g, ' ') };
};

function NotificationsModal({ isOpen, onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      const data = res.data || [];
      setNotifications(data);
      
      // Update unread count in navbar
      const unread = data.filter(n => !n.isRead).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unread);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleToggleRead = async (notification) => {
    try {
      await api.put(`/api/notifications/${notification._id}`, {
        isRead: !notification.isRead
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to update notification status');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) {
      return;
    }
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to delete notification');
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content admin-card" 
        onClick={e => e.stopPropagation()} 
        style={{
          width: '100%', maxWidth: '600px', maxHeight: '85vh', 
          display: 'flex', flexDirection: 'column',
          backgroundColor: 'var(--bg-card, #fff)', 
          borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          margin: 0, overflow: 'hidden'
        }}
      >
        <div className="admin-card-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color, #eee)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Notifications</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchNotifications}>
              Refresh
            </button>
            <button type="button" onClick={onClose} style={{
              background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
              color: 'var(--text-secondary, #666)', padding: '0 5px'
            }}>
              &times;
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p className="text-muted text-center py-4">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
              <p className="text-muted">You have no notifications right now.</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => {
                const meta = getTypeMeta(notification.type);
                return (
                <div 
                  key={notification._id} 
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`} 
                  style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid var(--border-color, #eee)',
                    backgroundColor: notification.isRead ? 'transparent' : 'var(--bg-hover, #f8f9fa)'
                  }}
                >
                  <div className="notification-content">
                    <div className="notification-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: notification.isRead ? 'inherit' : 'var(--primary-color)' }}>
                        {meta.icon} {meta.label}
                      </strong>
                      <span className="text-muted text-sm">{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: '0 0 1rem 0' }}>{notification.message}</p>
                  </div>
                  <div className="notification-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleToggleRead(notification)}>
                      {notification.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(notification._id)}>
                      Delete
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default NotificationsModal;
