import React, { useState } from 'react';
import api from '../../api/axios';

function AdminNotifications() {
  const [formData, setFormData] = useState({
    userId: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // In a real app we might have a user search dropdown here
  // For simplicity, accepting userId directly or showing a tip how to get it

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSuccess(false);
    
    try {
      await api.post('/api/admin/notifications', {
        userId: formData.userId,
        type: 'ADMIN_MESSAGE',
        message: formData.message
      });
      setSuccess(true);
      setFormData({...formData, message: ''}); // clear message
      // Hide success after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>System Notifications</h1>
      </header>

      <div className="admin-card max-w-lg">
        <h3>Send Notification to User</h3>
        <p className="text-muted mb-4">
          You can copy the User ID from the Users table and paste it here to send a direct system message.
        </p>
        
        {success && <div className="alert alert-success mb-3">Notification sent successfully!</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Target User ID</label>
            <input 
              type="text" 
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              required
              placeholder="e.g. 64d3..."
              className="admin-input"
            />
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
            ></textarea>
          </div>

          <button type="submit" disabled={sending} className="btn btn-primary mt-3">
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminNotifications;
