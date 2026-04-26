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
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);

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

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/api/notifications/mark-all-read');
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to mark all as read');
    } finally {
      setMarkingAll(false);
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'transparent', zIndex: 9999,
        display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start',
        padding: '5rem 5% 0 0'
      }}
    >
      <div
        className="premium-popover"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '400px', maxHeight: '520px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          marginTop: '1rem'
        }}
      >
        <div className="popover-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--card-border)' }}>
          Notifications
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: '200px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '3rem', opacity: 0.2 }}>🔔</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>No notifications yet</p>
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
                      borderBottom: '1px solid var(--card-border)',
                      backgroundColor: notification.isRead ? 'transparent' : 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '12px',
                      marginBottom: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div className="notification-content">
                      <div className="notification-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: notification.isRead ? 'var(--text-main)' : 'var(--primary)' }}>
                          {meta.icon} {meta.label}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(notification.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{notification.message}</p>
                    </div>
                    <div className="notification-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', width: 'auto', minWidth: '60px' }} onClick={() => handleToggleRead(notification)}>
                        {notification.isRead ? 'Unread' : 'Read'}
                      </button>
                      <button type="button" className="btn-danger" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', background: 'none', color: '#ef4444', border: 'none', boxShadow: 'none', width: 'auto' }} onClick={() => handleDelete(notification._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {unreadCount > 0 && (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--card-border)', textAlign: 'center', background: 'rgba(16, 185, 129, 0.02)' }}>
            <button
              id="modal-btn-mark-all-read"
              type="button"
              className="btn-primary"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '50px' }}
            >
              {markingAll ? 'Marking…' : 'Mark All as Read'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default NotificationsModal;
