import React, { useState, useEffect } from 'react';
import api from '../api/axios';

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
      alert('Unable to load notifications');
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
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>My Notifications</h1>
        <p className="text-muted">Stay updated on expiring items, budget alerts, and updates.</p>
      </header>

      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Recent Notifications</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchNotifications}>Refresh</button>
        </div>

        {loading ? (
          <p className="text-muted p-4">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-muted p-4">You have no notifications right now.</p>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => (
              <div key={notification._id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                <div className="notification-content">
                  <div className="notification-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{notification.type.replace(/_/g, ' ')}</strong>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
