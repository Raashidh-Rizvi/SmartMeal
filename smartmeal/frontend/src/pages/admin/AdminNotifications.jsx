import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  Bell,
  Send,
  Trash2,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  User,
  Eye,
  EyeOff,
  History,
  MessageSquare,
  Clock,
  ClipboardList,
  Zap,
  Radio,
  Megaphone,
  BellRing,
  Wifi
} from 'lucide-react';

function AdminNotifications() {
  const [formData, setFormData] = useState({ userId: 'ALL', message: '' });
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/users?limit=1000');
      setUsers(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [fetchNotifications, fetchUsers]);

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
      setSuccessMessage('Notification broadcasted successfully!');
      setFormData({ ...formData, message: '' });
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
      setSuccessMessage(`${res.data.created} expiration alert(s) generated.`);
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
      await api.put(`/api/admin/notifications/${notification._id}`, { isRead: !notification.isRead });
      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: !n.isRead } : n));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to update notification status');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await api.delete(`/api/admin/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ADMIN_MESSAGE': return <MessageSquare size={20} />;
      case 'EXPIRATION_ALERT': return <AlertTriangle size={20} />;
      case 'MEAL_REMINDER': return <Clock size={20} />;
      case 'MEAL_MISSING_INGREDIENTS': return <ClipboardList size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'ADMIN_MESSAGE': return { bg: 'rgba(16,185,129,0.12)', color: '#10b981' };
      case 'EXPIRATION_ALERT': return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
      case 'MEAL_REMINDER': return { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' };
      case 'MEAL_MISSING_INGREDIENTS': return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' };
      default: return { bg: 'rgba(16,185,129,0.12)', color: '#10b981' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Hero Header ── */}
      <div className="page-hero page-hero--sub">
        {/* Premium Decorative Background Icons */}
        <Bell size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '10%', left: '6%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <Send size={68} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '45%', left: '3%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <Megaphone size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '14%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <BellRing size={74} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '12%', right: '10%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        <Radio size={62} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '55%', right: '5%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <Wifi size={66} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '12%', right: '16%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <MessageSquare size={80} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '32%', right: '26%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <Zap size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '38%', left: '28%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <Bell size={46} color="#10b981" style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0.25rem 0 0.1rem' }}>System Communications</h1>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '1rem' }}>Broadcast alerts, manage system-wide notifications, and track automated warnings.</p>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleGenerateAlerts}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.85rem 1.5rem', borderRadius: '14px', border: '1px solid var(--card-border)',
              background: 'var(--card-bg)', color: 'var(--text-main)', fontWeight: 600,
              cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
              transition: 'all 0.2s ease', width: 'auto',
              backdropFilter: 'var(--glass-blur)'
            }}
          >
            <Zap size={16} color="#f59e0b" />
            {actionLoading ? 'Scanning...' : 'Run Expiration Scan'}
          </button>
        </div>
      </div>

      {/* ── Broadcast Form Card ── */}
      <div style={{
        background: 'var(--card-bg)', backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--card-border)', borderRadius: '24px',
        padding: '2rem', boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '14px',
            background: 'rgba(16,185,129,0.1)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Send size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Create Broadcast</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Send a priority message to a specific user or the entire community.
            </p>
          </div>
        </div>

        {successMessage && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.25rem',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '12px', color: '#065f46', fontWeight: 600, fontSize: '0.9rem',
            marginBottom: '1.5rem'
          }}>
            <CheckCircle size={18} color="#10b981" /> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Recipient(s)
            </label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
              style={{ width: '100%', padding: '0.9rem 1.25rem', borderRadius: '14px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.6)', color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem', boxSizing: 'border-box' }}
            >
              <option value="ALL">🌐 Global Broadcast (All Users)</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name || 'Unnamed User'} — {u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Message Content
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows="4"
              placeholder="Type your message here..."
              style={{ width: '100%', padding: '0.9rem 1.25rem', borderRadius: '14px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.6)', color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical', minHeight: '110px', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={sending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.9rem 2rem', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                fontWeight: 700, fontSize: '0.95rem', cursor: sending ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(16,185,129,0.3)', transition: 'all 0.2s ease', width: 'auto'
              }}
            >
              <Send size={17} />
              {sending ? 'Broadcasting...' : 'Launch Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Transmission Log ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Transmission Log</h3>
            {notifications.length > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '50px', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)' }}>
                {notifications.length}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={fetchNotifications}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1.1rem', borderRadius: '10px', border: '1px solid var(--card-border)',
              background: 'var(--card-bg)', color: 'var(--text-muted)', fontWeight: 600,
              fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease', width: 'auto'
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Sync
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--card-border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0 }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '4rem 2rem', borderRadius: '20px', border: '2px dashed var(--card-border)',
            background: 'rgba(16,185,129,0.02)', textAlign: 'center', gap: '0.75rem'
          }}>
            <Bell size={52} color="var(--card-border)" />
            <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>No transmissions yet</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Broadcast your first message using the form above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {notifications.map((notification) => {
              const { bg, color } = getIconBg(notification.type);
              const isUnread = !notification.isRead;
              return (
                <div
                  key={notification._id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                    padding: '1.25rem 1.5rem', borderRadius: '18px',
                    background: isUnread ? `linear-gradient(90deg, rgba(16,185,129,0.04) 0%, var(--card-bg) 100%)` : 'var(--card-bg)',
                    border: `1px solid ${isUnread ? 'rgba(16,185,129,0.2)' : 'var(--card-border)'}`,
                    borderLeft: isUnread ? '4px solid var(--primary)' : '1px solid var(--card-border)',
                    backdropFilter: 'var(--glass-blur)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.25s ease',
                    opacity: notification.isRead ? 0.8 : 1
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.2rem 0.65rem', borderRadius: '50px', background: bg, color }}>
                          {notification.type.replace(/_/g, ' ')}
                        </span>
                        {isUnread && (
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                        )}
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <Clock size={11} />
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 0.65rem', fontSize: '0.93rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                      {notification.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={12} />
                        <strong>
                          {notification.userId === 'ALL'
                            ? 'All Users'
                            : (users.find(u => u._id === notification.userId)?.name || notification.userId)}
                        </strong>
                      </span>
                      {notification.inventoryItemId && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <ClipboardList size={12} /> Item: {notification.inventoryItemId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleRead(notification)}
                      title={notification.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      style={{
                        width: 36, height: 36, padding: 0, overflow: 'visible', boxSizing: 'border-box',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '10px', border: '1px solid var(--card-border)', background: 'transparent',
                        color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      {notification.isRead ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(notification._id)}
                      title="Delete"
                      style={{
                        width: 36, height: 36, padding: 0, overflow: 'visible', boxSizing: 'border-box',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)',
                        color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default AdminNotifications;
