import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  Bell,
  BellOff,
  AlertTriangle,
  OctagonAlert,
  ShoppingCart,
  Calendar,
  UtensilsCrossed,
  Milk,
  RefreshCw,
  CheckCircle,
  Circle,
  Trash2,
  Settings,
  Mail,
  Smartphone,
  CheckCheck,
  ChefHat,
  Flame,
  Leaf,
  BellRing,
  MessageSquare
} from 'lucide-react';

const TYPE_META = {
  EXPIRING_FOOD:     { icon: <Milk size={18} />, label: 'Expiring Ingredient' },
  EXPIRING_LEFTOVER: { icon: <UtensilsCrossed size={18} />, label: 'Expiring Leftover' },
  BUDGET_WARNING:    { icon: <AlertTriangle size={18} color="#f59e0b" />, label: 'Budget Warning' },
  BUDGET_OVER:       { icon: <OctagonAlert size={18} color="#ef4444" />, label: 'Budget Exceeded' },
};

const getTypeMeta = (type = '') => {
  if (TYPE_META[type]) return TYPE_META[type];
  if (type.startsWith('MEAL_MISSING_INGREDIENTS')) return { icon: <ShoppingCart size={18} />, label: 'Missing Ingredients' };
  if (type.startsWith('MEAL_REMINDER'))            return { icon: <Calendar size={18} />, label: 'Meal Reminder' };
  return { icon: <Bell size={18} />, label: type.replace(/_/g, ' ') };
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);
  const [showSettings, setShowSettings]   = useState(false);

  // Notification preferences (TC_NM_07)
  const [prefs, setPrefs] = useState({
    notificationsEnabled: true,
    emailNotifications:   true,
    pushNotifications:    true,
  });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaved, setPrefsSaved]     = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/preferences');
      setPrefs(res.data);
    } catch (err) {
      console.error('Could not load notification preferences:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  // ── Mark single read/unread ─────────────────────────────────────────────────
  const handleToggleRead = async (notification) => {
    try {
      await api.put(`/api/notifications/${notification._id}`, {
        isRead: !notification.isRead,
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to update notification status');
    }
  };

  // ── Mark ALL as read (TC_NM_05) ─────────────────────────────────────────────
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

  // ── Delete notification (TC_NM_06) ──────────────────────────────────────────
  const handleDelete = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to delete notification');
    }
  };

  // ── Save preferences (TC_NM_07) ─────────────────────────────────────────────
  const handleSavePreferences = async () => {
    setPrefsLoading(true);
    setPrefsSaved(false);
    try {
      await api.put('/api/notifications/preferences', prefs);
      setPrefsSaved(true);
      // Re-fetch notifications list (if disabled, backend won't generate new ones)
      fetchNotifications();
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Unable to save preferences');
    } finally {
      setPrefsLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <header className="page-hero">
        {/* Premium Decorative Background Icons - Scattered Artistically */}
        <UtensilsCrossed size={70} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '10%', left: '10%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <ChefHat size={86} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '45%', left: '4%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <Flame size={54} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '12%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <Leaf size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '15%', right: '12%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        
        <Bell size={62} className="hero-sway" style={{ position: 'absolute', opacity: 0.08, color: '#10b981', pointerEvents: 'none', top: '60%', right: '5%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <BellRing size={66} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '10%', right: '15%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <Settings size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '35%', right: '25%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <MessageSquare size={54} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '35%', left: '28%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
            {prefs.notificationsEnabled ? <Bell size={48} color="#10b981" strokeWidth={1.75} /> : <BellOff size={48} color="#94a3b8" strokeWidth={1.75} />}
        </div>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            My Notifications
          </h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>Stay updated on expiring items, budget alerts, and updates.</p>
        </div>
      </header>

      {/* ── Notification Preferences Card (TC_NM_07) ── */}
      <div className="card" style={{ marginBottom: '1.5rem', border: showSettings ? '2px solid var(--primary)' : '1px solid var(--border-color)', transition: 'border 0.2s' }}>
        <div
          className="card-header"
          onClick={() => setShowSettings(s => !s)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', cursor: 'pointer', borderBottom: showSettings ? '1px solid var(--border-color)' : 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Notification Settings</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
            {showSettings ? '▲ Hide' : '▼ Show'}
          </span>
        </div>

        {showSettings && (
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Master toggle */}
            <label
              htmlFor="toggle-notifications-enabled"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {prefs.notificationsEnabled ? <Bell size={18} color="var(--primary)" /> : <BellOff size={18} color="#94a3b8" />}
                <div>
                  <strong>Enable Notifications</strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Toggle all in-app notifications on or off
                  </p>
                </div>
              </div>
              <div style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                <input
                  id="toggle-notifications-enabled"
                  type="checkbox"
                  checked={prefs.notificationsEnabled}
                  onChange={e => setPrefs(p => ({ ...p, notificationsEnabled: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <span
                  onClick={() => setPrefs(p => ({ ...p, notificationsEnabled: !p.notificationsEnabled }))}
                  style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: prefs.notificationsEnabled ? 'var(--primary, #059669)' : '#cbd5e1',
                    borderRadius: '26px', transition: '0.3s',
                  }}
                >
                  <span style={{
                    position: 'absolute', height: '20px', width: '20px', left: prefs.notificationsEnabled ? '24px' : '4px',
                    bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </div>
            </label>

            {/* Email toggle */}
            <label
              htmlFor="toggle-email-notifications"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer', opacity: prefs.notificationsEnabled ? 1 : 0.4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={18} color="#64748b" />
                <div>
                  <strong>Email Notifications</strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Receive alerts via email
                  </p>
                </div>
              </div>
              <div style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                <input
                  id="toggle-email-notifications"
                  type="checkbox"
                  checked={prefs.emailNotifications}
                  disabled={!prefs.notificationsEnabled}
                  onChange={e => setPrefs(p => ({ ...p, emailNotifications: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <span
                  onClick={() => prefs.notificationsEnabled && setPrefs(p => ({ ...p, emailNotifications: !p.emailNotifications }))}
                  style={{
                    position: 'absolute', cursor: prefs.notificationsEnabled ? 'pointer' : 'not-allowed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: prefs.emailNotifications && prefs.notificationsEnabled ? 'var(--primary, #059669)' : '#cbd5e1',
                    borderRadius: '26px', transition: '0.3s',
                  }}
                >
                  <span style={{
                    position: 'absolute', height: '20px', width: '20px',
                    left: prefs.emailNotifications && prefs.notificationsEnabled ? '24px' : '4px',
                    bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </div>
            </label>

            {/* Push toggle */}
            <label
              htmlFor="toggle-push-notifications"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer', opacity: prefs.notificationsEnabled ? 1 : 0.4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Smartphone size={18} color="#64748b" />
                <div>
                  <strong>Push Notifications</strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Receive push alerts on your device
                  </p>
                </div>
              </div>
              <div style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                <input
                  id="toggle-push-notifications"
                  type="checkbox"
                  checked={prefs.pushNotifications}
                  disabled={!prefs.notificationsEnabled}
                  onChange={e => setPrefs(p => ({ ...p, pushNotifications: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <span
                  onClick={() => prefs.notificationsEnabled && setPrefs(p => ({ ...p, pushNotifications: !p.pushNotifications }))}
                  style={{
                    position: 'absolute', cursor: prefs.notificationsEnabled ? 'pointer' : 'not-allowed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: prefs.pushNotifications && prefs.notificationsEnabled ? 'var(--primary, #059669)' : '#cbd5e1',
                    borderRadius: '26px', transition: '0.3s',
                  }}
                >
                  <span style={{
                    position: 'absolute', height: '20px', width: '20px',
                    left: prefs.pushNotifications && prefs.notificationsEnabled ? '24px' : '4px',
                    bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </div>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                id="btn-save-notification-prefs"
                type="button"
                className="btn-primary"
                onClick={handleSavePreferences}
                disabled={prefsLoading}
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}
              >
                {prefsLoading ? 'Saving…' : 'Save Settings'}
              </button>
              {prefsSaved && (
                <span style={{ color: 'var(--primary, #059669)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={16} /> Settings saved!
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Notifications List Card ── */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>
            Recent Notifications
            {unreadCount > 0 && (
              <span style={{ marginLeft: '0.6rem', background: 'var(--primary, #059669)', color: '#fff', borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>
                {unreadCount} unread
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                type="button"
                className="btn-secondary"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <CheckCheck size={15} />
                {markingAll ? 'Marking…' : 'Mark All Read'}
              </button>
            )}
            <button
              id="btn-refresh-notifications"
              type="button"
              className="btn-secondary"
              onClick={fetchNotifications}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <RefreshCw size={16} className={loading ? 'spinner' : ''} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p className="text-muted">Loading notifications…</p>
          </div>
        ) : !prefs.notificationsEnabled ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <BellOff size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
            <p className="text-muted">Notifications are disabled. Enable them in Settings above.</p>
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
                <div
                  key={notification._id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: notification.isRead ? 'transparent' : 'rgba(5,150,105,0.04)',
                    transition: 'background 0.2s'
                  }}
                >
                  <div className="notification-content">
                    <div className="notification-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ color: 'var(--primary)' }}>{meta.icon}</span>
                        <strong style={{ fontSize: '1.05rem' }}>{meta.label}</strong>
                        {!notification.isRead && (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary, #059669)', display: 'inline-block' }} />
                        )}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-color)', lineHeight: '1.5' }}>
                      {notification.message}
                    </p>
                  </div>
                  <div className="notification-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleToggleRead(notification)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                    >
                      {notification.isRead ? <Circle size={14} /> : <CheckCircle size={14} />}
                      {notification.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDelete(notification._id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                    >
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
