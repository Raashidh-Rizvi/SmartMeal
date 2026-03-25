import React, { useState, useEffect } from 'react';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import LeftoverForm from './components/LeftoverForm';
import LeftoverList from './components/LeftoverList';
import BudgetDashboard from './components/BudgetDashboard';
import { leftoverService } from './services/leftoverService';
import { requestNotificationPermission, notifyWithPush } from './utils/notifications';

function App() {
  const [activeTab, setActiveTab] = useState('leftovers');
  const [leftovers, setLeftovers] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [includeUsed, setIncludeUsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLeftovers = async () => {
    try {
      setLoading(true);
      const [allResponse, expiringResponse] = await Promise.all([
        leftoverService.getAll(includeUsed),
        leftoverService.getExpiringSoon(3)
      ]);
      setLeftovers(allResponse.data);
      setExpiringSoon(expiringResponse.data);
    } catch (error) {
      console.error('Error fetching leftovers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    if (activeTab === 'leftovers') {
      fetchLeftovers();
    }
  }, [includeUsed, activeTab]);

  useEffect(() => {
    if (expiringSoon.length > 0) {
      notifyWithPush(
        'warning',
        `${expiringSoon.length} item(s) expiring soon!`,
        '🍽️ Leftover Alert',
        `You have ${expiringSoon.length} item(s) expiring within 3 days`
      );
    }
  }, [expiringSoon.length]);

  return (
    <div className="app">
      <div className="main-header">
        <h1>🍽️ Smart Meal Planning System</h1>
        <div className="nav-tabs">
          <button 
            className={`tab ${activeTab === 'leftovers' ? 'active' : ''}`}
            onClick={() => setActiveTab('leftovers')}
          >
            🍽️ Leftovers
          </button>
          <button 
            className={`tab ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            💰 Budget
          </button>
        </div>
      </div>

      {activeTab === 'leftovers' ? (
        <>
          <div className="header">
            <h1>🍽️ Smart Leftover Manager</h1>
            <p>Track your leftovers and reduce food waste</p>
          </div>

          {expiringSoon.length > 0 && (
            <div className="alert alert-warning">
              ⚠️ <strong>{expiringSoon.length}</strong> item(s) expiring within 3 days!
            </div>
          )}

          <div className="container">
            <LeftoverForm onSuccess={fetchLeftovers} />

            <div>
              <div className="filter-section">
                <label>
                  <input
                    type="checkbox"
                    checked={includeUsed}
                    onChange={(e) => setIncludeUsed(e.target.checked)}
                  />
                  Show used items
                </label>
              </div>

              <div className="card">
                <h2 style={{ color: '#4caf50', marginBottom: '24px', fontSize: '1.8rem' }}>
                  📋 Your Leftovers ({leftovers.length})
                </h2>
                {loading ? (
                  <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
                ) : leftovers.length === 0 ? (
                  <div className="alert alert-info">
                    No leftovers found. Add your first leftover to get started! 🎉
                  </div>
                ) : (
                  <LeftoverList leftovers={leftovers} onUpdate={fetchLeftovers} />
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <BudgetDashboard />
      )}
      <ToastContainer />
    </div>
  );
}

export default App;
