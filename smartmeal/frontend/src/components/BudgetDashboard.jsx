import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { budgetService } from '../services/budgetService';
import { Wallet, UtensilsCrossed, ChefHat, Flame, Leaf } from 'lucide-react';

function BudgetDashboard() {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toast, setToast] = useState(null);

  const emptyBudgetForm = { amount: '', period: 'monthly', start_date: new Date().toISOString().slice(0, 16) };
  const emptyExpenseForm = { item_name: '', amount: '', category: '', date: new Date().toISOString().slice(0, 16), notes: '' };
  const [budgetForm, setBudgetForm] = useState(emptyBudgetForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchData = async () => {
    try {
      setLoading(true);
      const [s, e] = await Promise.all([budgetService.getSummary(), budgetService.getExpenses()]);
      setSummary(s.data);
      setExpenses(e.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!summary) return;
    if (summary.is_over_budget) showToast('error', `Budget exceeded by $${Math.abs(summary.remaining).toFixed(2)}!`);
    else if (summary.warning_threshold_reached) showToast('warning', `${summary.percentage_used.toFixed(1)}% of budget used`);
  }, [summary?.is_over_budget, summary?.warning_threshold_reached, summary]);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      await budgetService.createBudget({ ...budgetForm, amount: parseFloat(budgetForm.amount), start_date: new Date(budgetForm.start_date).toISOString() });
      setShowBudgetModal(false);
      setBudgetForm(emptyBudgetForm);
      showToast('success', 'Budget saved!');
      fetchData();
    } catch (err) { showToast('error', err.response?.data?.detail || 'Failed to save budget'); }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...expenseForm, amount: parseFloat(expenseForm.amount), date: new Date(expenseForm.date).toISOString() };
      if (editingExpense) {
        await budgetService.updateExpense(editingExpense.id, payload);
        showToast('success', 'Expense updated!');
      } else {
        await budgetService.createExpense(payload);
        showToast('success', 'Expense added!');
      }
      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseForm(emptyExpenseForm);
      fetchData();
    } catch (err) { showToast('error', err.response?.data?.detail || 'Failed to save expense'); }
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      item_name: expense.item_name,
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().slice(0, 16),
      notes: expense.notes || ''
    });
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await budgetService.deleteExpense(id);
      showToast('success', 'Expense deleted!');
      fetchData();
    } catch { showToast('error', 'Failed to delete expense'); }
  };

  const fmt = (n) => `$${Number(n).toFixed(2)}`;

  if (loading) return <p className="loading">Loading budget...</p>;

  return (
    <div>
      {/* Page Header */}
      <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 1rem 2rem', minHeight: '160px' }}>
        {/* Decorative Background Icons - Corner Accents */}
        <UtensilsCrossed size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '8px', left: '8px', '--rotation': '-15deg' }} />
        <ChefHat size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '8px', right: '8px', '--rotation': '10deg', animationDelay: '1s' }} />
        <Flame size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '8px', right: '8px', '--rotation': '20deg', animationDelay: '2s' }} />
        <Leaf size={72} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '8px', left: '8px', '--rotation': '-10deg', animationDelay: '3s' }} />

        <Wallet size={48} color="var(--primary)" strokeWidth={1.75} style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>Budget Tracker</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>Monitor your spending and stay on top of your food budget</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-section" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: '🎯', label: 'Budget', value: summary?.budget ? fmt(summary.budget.amount) : 'Not Set', sub: summary?.budget?.period || '' },
          { icon: '💸', label: 'Spent', value: fmt(summary?.total_spent || 0), sub: `${summary?.expenses_count || 0} expenses` },
          { icon: summary?.is_over_budget ? '❌' : '✅', label: 'Remaining', value: fmt(summary?.remaining || 0), sub: `${(summary?.percentage_used || 0).toFixed(1)}% used` },
        ].map(({ icon, label, value, sub }) => (
          <div className="stat-card" key={label} style={label === 'Remaining' && summary?.is_over_budget ? { borderLeftColor: 'var(--danger)' } : {}}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-info">
              <h3>{label}</h3>
              <p className="stat-value" style={{ fontSize: '1.5rem' }}>{value}</p>
              {sub && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {summary?.is_over_budget && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          ⚠️ You've exceeded your budget by {fmt(Math.abs(summary.remaining))}!
        </div>
      )}
      {!summary?.is_over_budget && summary?.warning_threshold_reached && (
        <div className="alert" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '1.5rem' }}>
          ⚠️ You've used {summary.percentage_used.toFixed(1)}% of your budget
        </div>
      )}

      {/* Progress Bar */}
      {summary?.budget && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span>Budget Usage</span>
            <span>{(summary.percentage_used || 0).toFixed(1)}%</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'var(--card-border)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(summary.percentage_used, 100)}%`,
              background: summary.is_over_budget ? 'var(--danger)' : 'linear-gradient(90deg, var(--primary), var(--primary-hover))',
              borderRadius: '999px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      )}

      {/* Budget Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Budget</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              {summary?.budget ? `${summary.budget.period} budget starting ${new Date(summary.budget.start_date).toLocaleDateString()}` : 'No budget set yet.'}
            </p>
          </div>
          <button onClick={() => { setShowBudgetModal(true); }} style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
            {summary?.budget ? '✏️ Edit Budget' : '+ Set Budget'}
          </button>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Expenses</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Track your food spending.</p>
          </div>
          <button onClick={() => { setEditingExpense(null); setExpenseForm(emptyExpenseForm); setShowExpenseModal(true); }}
            style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
            + Add Expense
          </button>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan="6" className="empty-message">No expenses yet. Add your first one!</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id}>
                  <td><strong>{exp.item_name}</strong></td>
                  <td><span className="badge badge-user">{exp.category}</span></td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{fmt(exp.amount)}</td>
                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{exp.notes || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openEditExpense(exp)} className="btn-icon">Edit</button>
                      <span style={{ color: 'var(--text-muted)' }}>|</span>
                      <button onClick={() => handleDeleteExpense(exp.id)} className="btn-icon text-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Modal */}
      {showBudgetModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>💰 Set Budget</h2>
            <form onSubmit={handleBudgetSubmit}>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Amount ($)</label>
                  <input type="number" step="0.01" value={budgetForm.amount} onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })} placeholder="e.g., 500" required />
                </div>
                <div className="form-group">
                  <label>Period</label>
                  <select value={budgetForm.period} onChange={e => setBudgetForm({ ...budgetForm, period: e.target.value })}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="datetime-local" value={budgetForm.start_date} onChange={e => setBudgetForm({ ...budgetForm, start_date: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary flex-1">Save Budget</button>
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowBudgetModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Expense Modal */}
      {showExpenseModal && createPortal(
        <div className="modal-backdrop" onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingExpense ? '✏️ Edit Expense' : '💸 Add Expense'}</h2>
            <form onSubmit={handleExpenseSubmit}>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Item Name</label>
                  <input type="text" value={expenseForm.item_name} onChange={e => setExpenseForm({ ...expenseForm, item_name: e.target.value })} placeholder="e.g., Groceries" required />
                </div>
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} placeholder="e.g., Vegetables" required />
                </div>
                <div className="form-group form-group-full">
                  <label>Date</label>
                  <input type="datetime-local" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                </div>
                <div className="form-group form-group-full">
                  <label>Notes (optional)</label>
                  <input type="text" value={expenseForm.notes} onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Optional notes" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary flex-1">{editingExpense ? 'Update' : 'Add Expense'}</button>
                <button type="button" className="btn btn-secondary flex-1" onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default BudgetDashboard;
