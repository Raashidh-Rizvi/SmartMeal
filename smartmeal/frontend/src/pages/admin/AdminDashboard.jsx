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
  Clock
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
      borderColor: '#8884d8',
      backgroundColor: 'rgba(136, 132, 216, 0.2)',
      tension: 0.4
    }]
  };

  const categoryData = {
    labels: Object.keys(analytics?.categories || {}),
    datasets: [{
      data: Object.values(analytics?.categories || {}),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e2e8f0', usePointStyle: true }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div className="admin-analytics-container">
      <header className="admin-header">
        <div className="header-info">
          <h1>Analytics Executive Suite</h1>
          <p className="subtitle">Real-time insights across SmartMeal platform</p>
        </div>
        <button onClick={fetchData} className="btn-refresh">
          <RefreshCw size={18} /> Refresh
        </button>
      </header>

      {/* Top Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(54, 162, 235, 0.15)', color: '#36A2EB' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Registered Users</h3>
            <p className="value">{metrics.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(75, 192, 192, 0.15)', color: '#4BC0C0' }}>
            <Utensils size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Recipes</h3>
            <p className="value">{metrics.totalRecipes}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 206, 86, 0.15)', color: '#FFCE56' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Meals Scheduled</h3>
            <p className="value">{metrics.totalMeals}</p>
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
          <h2><Star size={20} className="icon-gold" /> Highly Recommended Food</h2>
          <p className="section-desc">Based on highest average user ratings</p>
          <div className="top-list">
            {analytics?.highlyRated?.map((recipe, index) => (
              <div key={index} className="top-list-item">
                <span className="rank">{index + 1}</span>
                <span className="recipe-name">{recipe.name}</span>
                <span className="metric-badge">
                   ⭐ {recipe.rating}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Favorited / Scheduled */}
        <div className="top-list-card">
          <h2><Award size={20} className="icon-blue" /> Most Favorited Foods</h2>
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
