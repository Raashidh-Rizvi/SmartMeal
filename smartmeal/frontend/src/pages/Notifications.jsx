import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Bell, 
  AlertTriangle, 
  OctagonAlert, 
  ShoppingCart, 
  Calendar, 
  UtensilsCrossed, 
  Milk, 
  RefreshCw, 
  CheckCircle, 
  Circle, 
  Trash2 
} from 'lucide-react';

const TYPE_META = {
  EXPIRING_FOOD:       { icon: <Milk size={18} />, label: 'Expiring Ingredient' },
  EXPIRING_LEFTOVER:   { icon: <UtensilsCrossed size={18} />, label: 'Expiring Leftover' },
  BUDGET_WARNING:      { icon: <AlertTriangle size={18} color="#f59e0b" />, label: 'Budget Warning' },
  BUDGET_OVER:         { icon: <OctagonAlert size={18} color="#ef4444" />, label: 'Budget Exceeded' },
};

const getTypeMeta = (type = '') => {
  if (TYPE_META[type]) return TYPE_META[type];
  if (type.startsWith('MEAL_MISSING_INGREDIENTS')) return { icon: <ShoppingCart size={18} />, label: 'Missing Ingredients' };
  if (type.startsWith('MEAL_REMINDER'))            return { icon: <Calendar size={18} />, label: 'Meal Reminder' };
  return { icon: <Bell size={18} />, label: type.replace(/_/g, ' ') };
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Bell size={32} color="var(--primary)" />
          My Notifications
        </h1>
        <p className="text-muted">Stay updated on expiring items, budget alerts, and updates.</p>
      </header>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0 }}>Recent Notifications</h3>
          <button type="button" className="btn-secondary" onClick={fetchNotifications} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <RefreshCw size={16} className={loading ? 'spinner' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p className="text-muted">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Bell size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
            <p className="text-muted">You have no notifications right now.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => {
              const meta = getTypeMeta(notification.type);
              return (
              <div key={notification._id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`} style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', background: notification.isRead ? 'transparent' : 'rgba(5,150,105,0.02)', transition: 'background 0.2s' }}>
                <div className="notification-content">
                  <div className="notification-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--primary)' }}>{meta.icon}</span>
                      <strong style={{ fontSize: '1.05rem' }}>{meta.label}</strong>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(notification.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-color)', lineHeight: '1.5' }}>{notification.message}</p>
                </div>
                <div className="notification-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => handleToggleRead(notification)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                    {notification.isRead ? <Circle size={14} /> : <CheckCircle size={14} />}
                    {notification.isRead ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <button type="button" className="btn-danger" onClick={() => handleDelete(notification._id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
