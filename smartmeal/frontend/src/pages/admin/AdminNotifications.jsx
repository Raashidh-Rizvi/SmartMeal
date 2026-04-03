import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

function AdminNotifications() {
  const [formData, setFormData] = useState({
    userId: 'ALL',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users?limit=1000');
      setUsers(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSuccessMessage('');

    try {
      await api.post('/api/admin/notifications', {
        userId: formData.userId,
        type: 'ADMIN_MESSAGE',
        message: formData.message
      });
      setSuccessMessage('Notification sent successfully!');
      setFormData({...formData, message: ''});
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateAlerts = async () => {
    setActionLoading(true);
    setSuccessMessage('');

    try {
      const res = await api.post('/api/admin/notifications/expiration-alerts');
      setSuccessMessage(`${res.data.created} expiration alert(s) created.`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to generate expiration alerts');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRead = async (notification) => {
    try {
      await api.put(`/api/admin/notifications/${notification._id}`, {
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
      await api.delete(`/api/admin/notifications/${notificationId}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to delete notification');
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>System Notifications</h1>
      </header>

      <div className="admin-card max-w-lg">
        <div className="admin-card-header">
          <div>
            <h3>Send Notification to User</h3>
            <p className="text-muted mb-2">
              Select a user or choose 'All Users' to broadcast a message.
            </p>
          </div>
          <button
            type="button"
            disabled={actionLoading}
            className="btn btn-secondary"
            onClick={handleGenerateAlerts}
          >
            {actionLoading ? 'Generating...' : 'Generate Expiration Alerts'}
          </button>
        </div>

        {successMessage && <div className="alert alert-success mb-3">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Target User</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              required
              className="admin-input"
            >
              <option value="ALL">All Users (Broadcast)</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name || 'Unnamed User'} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Message Content</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
              rows="4"
              placeholder="Write your message here..."
              className="admin-input"
            />
          </div>

          <button type="submit" disabled={sending} className="btn btn-primary mt-3">
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>

      <div className="admin-card mt-6">
        <div className="admin-card-header">
          <div>
            <h3>Notification History</h3>
            <p className="text-muted mb-2">All user notifications created by the admin and expiration alerts.</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={fetchNotifications}>Refresh</button>
        </div>

        {loading ? (
          <p className="text-muted">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-muted">No notifications yet.</p>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => (
              <div key={notification._id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
                <div className="notification-content">
                  <div className="notification-title">
                    <strong>{notification.type.replace(/_/g, ' ')}</strong>
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{notification.message}</p>
                  <div className="notification-meta">
                    <span>User: {notification.userId === 'ALL' ? 'ALL USERS' : notification.userId}</span>
                    {notification.inventoryItemId && <span> | Item: {notification.inventoryItemId}</span>}
                  </div>
                </div>
                <div className="notification-actions">
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

export default AdminNotifications;
