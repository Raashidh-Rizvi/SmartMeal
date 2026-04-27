import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
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
import { Line, Pie, Bar } from 'react-chartjs-2';
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

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    totalMeals: 0
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
      setAnalytics(analyticsRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
    labels: Object.keys(analytics?.categories || {}),
    datasets: [{
      data: Object.values(analytics?.categories || {}),
      backgroundColor: [
        '#10b981',
        '#3b82f6',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6'
      ],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', usePointStyle: true, font: { family: 'Inter' } }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' }
      }
    },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Inter' } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Inter' } } }
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

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-container main-chart">
          <h2>Usage Trends (Last 7 Days)</h2>
          <Line data={usageTrendData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h2>Popular Categories</h2>
          <div style={{ maxHeight: '300px', display: 'flex', justifyContent: 'center' }}>
            <Pie data={categoryData} options={{ ...chartOptions, scales: {} }} />
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
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
