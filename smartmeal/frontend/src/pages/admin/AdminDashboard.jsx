import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
<<<<<<< HEAD
=======
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Users, 
  Utensils, 
  TrendingUp, 
  Star,
  Award,
  RefreshCw,
  Clock,
  BarChart2,
  PieChart,
  Activity,
  Layers,
  Gauge
} from 'lucide-react';
import './AdminCharts.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
<<<<<<< HEAD
    totalInventoryItems: 0,
    itemsExpiringSoon: 0,
    expiredItems: 0
  });
=======
    totalRecipes: 0,
    totalMeals: 0
  });
  const [analytics, setAnalytics] = useState(null);
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
<<<<<<< HEAD
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
=======
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, analyticsRes] = await Promise.all([
        api.get('/api/admin/metrics'),
        api.get('/api/admin/analytics')
      ]);
      setMetrics(metricsRes.data);
      console.log("Analytics Data:", analyticsRes.data);
      setAnalytics(analyticsRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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
        <div className="metric-card">
          <h3>Total Inventory Items</h3>
          <p className="metric-value">{metrics.totalInventoryItems}</p>
        </div>
        <div className="metric-card warning">
          <h3>Items Expiring Soon (3 days)</h3>
          <p className="metric-value">{metrics.itemsExpiringSoon}</p>
        </div>
        <div className="metric-card danger">
          <h3>Expired Items</h3>
          <p className="metric-value">{metrics.expiredItems}</p>
=======
  if (loading) return (
    <div className="admin-loading">
      <div className="loader"></div>
      <p>Crunching metrics...</p>
    </div>
  );

  if (error) return (
    <div className="admin-error">
      <p>{error}</p>
      <button onClick={fetchData} className="btn-retry">Try Again</button>
    </div>
  );

  // Chart Data Preparation
  const usageTrendData = {
    labels: analytics?.usageTrends?.map(t => t._id) || [],
    datasets: [{
      label: 'Meals Planned',
      data: analytics?.usageTrends?.map(t => t.count) || [],
      fill: true,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4
    }]
  };

  const categoryData = {
    labels: Object.keys(analytics?.categories || {}).length ? Object.keys(analytics?.categories) : ['No Data'],
    datasets: [{
      data: Object.values(analytics?.categories || {}).length ? Object.values(analytics?.categories) : [1],
      backgroundColor: Object.keys(analytics?.categories || {}).length ? [
        '#10b981',
        '#3b82f6',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
        '#ec4899',
        '#14b8a6'
      ] : ['#e2e8f0'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: 'var(--text-muted)', usePointStyle: true, padding: 20, font: { family: 'Inter', weight: '500' } }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 12,
        titleFont: { family: 'Inter', size: 14, weight: '600' },
        bodyFont: { family: 'Inter', size: 13 },
        boxPadding: 6,
        usePointStyle: true,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: { 
        min: 0,
        suggestedMax: 5,
        border: { display: false },
        grid: { color: 'rgba(0, 0, 0, 0.06)', drawBorder: false }, 
        ticks: { 
          color: 'var(--text-muted)', 
          font: { family: 'Inter' }, 
          padding: 10,
          precision: 0,
          stepSize: 1
        },
        beginAtZero: true
      },
      x: { 
        border: { display: false },
        grid: { display: false, drawBorder: false }, 
        ticks: { color: 'var(--text-muted)', font: { family: 'Inter' }, padding: 10 } 
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'right',
        labels: { color: 'var(--text-muted)', usePointStyle: true, padding: 20, font: { family: 'Inter', weight: '500' } }
      },
      tooltip: chartOptions.plugins.tooltip
    }
  };

  return (
    <div className="admin-analytics-container">
      <div className="page-hero page-hero--sub">
        {/* Premium Decorative Background Icons */}
        <BarChart2 size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '10%', left: '6%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <TrendingUp size={68} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '45%', left: '3%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <PieChart size={56} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '14%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <Activity size={74} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '12%', right: '10%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        <Users size={62} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '55%', right: '5%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <Layers size={66} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '12%', right: '16%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <Gauge size={80} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '32%', right: '26%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <BarChart2 size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '38%', left: '28%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <Activity size={46} color="#10b981" style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0.25rem 0 0.1rem' }}>Analytics Executive Suite</h1>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '1rem' }}>Real-time platform insights &amp; performance metrics</p>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={fetchData} className="btn-refresh premium">
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> 
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card premium">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(54, 162, 235, 0.12)', color: '#36A2EB' }}>
              <Users size={24} />
            </div>
            <h3>Registered Users</h3>
          </div>
          <div className="stat-body">
            <p className="value">{metrics.totalUsers}</p>
            <span className="trend positive">↑ 12% this month</span>
          </div>
        </div>

        <div className="stat-card premium">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(75, 192, 192, 0.12)', color: '#4BC0C0' }}>
              <Utensils size={24} />
            </div>
            <h3>Active Recipes</h3>
          </div>
          <div className="stat-body">
            <p className="value">{metrics.totalRecipes}</p>
            <span className="trend positive">↑ 8 new today</span>
          </div>
        </div>

        <div className="stat-card premium">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 206, 86, 0.12)', color: '#FFCE56' }}>
              <TrendingUp size={24} />
            </div>
            <h3>Total Meals Scheduled</h3>
          </div>
          <div className="stat-body">
            <p className="value">{metrics.totalMeals}</p>
            <span className="trend neutral">Steady growth</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container main-chart">
          <div className="chart-header">
            <h2><TrendingUp size={20} className="icon-green" /> Usage Trends (Last 7 Days)</h2>
            <div className="chart-badge">Active</div>
          </div>
          <div className="chart-wrapper line-chart-wrapper">
            {analytics?.usageTrends?.length > 0 ? (
              <Line 
                data={{
                  ...usageTrendData,
                  datasets: [{
                    ...usageTrendData.datasets[0],
                    backgroundColor: (context) => {
                      const ctx = context.chart.ctx;
                      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                      return gradient;
                    },
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                  }]
                }} 
                options={chartOptions} 
              />
            ) : (
              <div className="empty-chart-state">
                <BarChart2 size={48} className="empty-icon" />
                <p>Not enough data to display trends yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h2><PieChart size={20} className="icon-blue" /> Popular Categories</h2>
          </div>
          <div className="chart-wrapper doughnut-chart-wrapper">
            {Object.keys(analytics?.categories || {}).length > 0 ? (
              <div style={{ position: 'relative', height: '100%', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                <Doughnut data={categoryData} options={doughnutOptions} />
              </div>
            ) : (
              <div className="empty-chart-state">
                <PieChart size={48} className="empty-icon" />
                <p>No category data yet.</p>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Start planning meals to see categories.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Lists Section */}
      <div className="top-lists-container">
        {/* Most Recommended / Highly Rated */}
        <div className="top-list-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Star size={20} className="icon-gold" /> Highly Recommended Food</h2>
          <p className="section-desc">Based on highest average user ratings</p>
          <div className="top-list">
            {analytics?.highlyRated?.map((recipe, index) => (
              <div key={index} className="top-list-item">
                <span className="rank">{index + 1}</span>
                <span className="recipe-name">{recipe.name}</span>
                <span className="metric-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                   <Star size={14} fill="currentColor" /> {recipe.rating}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Favorited / Scheduled */}
        <div className="top-list-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Award size={20} className="icon-blue" /> Most Favorited Foods</h2>
          <p className="section-desc">Most frequently added to user meal plans</p>
          <div className="top-list">
            {analytics?.mostFavorited?.map((recipe, index) => (
              <div key={index} className="top-list-item">
                <span className="rank">{index + 1}</span>
                <span className="recipe-name">{recipe.name}</span>
                <span className="metric-badge">
                   {recipe.count} uses
                </span>
              </div>
            ))}
          </div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
