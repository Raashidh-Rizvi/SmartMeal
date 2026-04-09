import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalInventoryItems: 0,
    itemsExpiringSoon: 0,
    expiredItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/metrics');
      setMetrics(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading metrics...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Dashboard Overview</h1>
        <button onClick={fetchMetrics} className="btn btn-secondary">Refresh</button>
      </header>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Users</h3>
          <p className="metric-value">{metrics.totalUsers}</p>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
