import React, { useState, useEffect } from 'react';
import { budgetService } from '../services/budgetService';
import { notify, notifyWithPush } from '../utils/notifications';
import '../styles/Budget.css';

const BudgetDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseForm, setEditExpenseForm] = useState({});
  
  const [budgetForm, setBudgetForm] = useState({
    amount: '',
    period: 'monthly',
    start_date: new Date().toISOString().slice(0, 16)
  });
  
  const [expenseForm, setExpenseForm] = useState({
    item_name: '',
    amount: '',
    category: '',
    date: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        budgetService.getSummary(),
        budgetService.getExpenses()
      ]);
      setSummary(summaryRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (summary && summary.warning_threshold_reached && !summary.is_over_budget) {
      notifyWithPush(
        'warning',
        `Budget warning: ${summary.percentage_used.toFixed(1)}% used`,
        '💰 Budget Alert',
        `You've used ${summary.percentage_used.toFixed(1)}% of your budget`
      );
    }
    if (summary && summary.is_over_budget) {
      notifyWithPush(
        'error',
        'Budget exceeded!',
        '⚠️ Budget Exceeded',
        `You've exceeded your budget by $${Math.abs(summary.remaining).toFixed(2)}`
      );
    }
  }, [summary]);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...budgetForm,
        amount: parseFloat(budgetForm.amount),
        start_date: new Date(budgetForm.start_date).toISOString()
      };
      await budgetService.createBudget(data);
      setShowBudgetForm(false);
      setBudgetForm({ amount: '', period: 'monthly', start_date: new Date().toISOString().slice(0, 16) });
      notify.success('Budget created successfully!');
      fetchData();
    } catch (error) {
      notify.error(error.response?.data?.detail || 'Failed to create budget');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        date: new Date(expenseForm.date).toISOString()
      };
      await budgetService.createExpense(data);
      setShowExpenseForm(false);
      setExpenseForm({ item_name: '', amount: '', category: '', date: new Date().toISOString().slice(0, 16), notes: '' });
      notify.success('Expense added successfully!');
      fetchData();
    } catch (error) {
      notify.error(error.response?.data?.detail || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await budgetService.deleteExpense(id);
        notify.success('Expense deleted successfully!');
        fetchData();
      } catch (error) {
        notify.error('Failed to delete expense');
      }
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setEditExpenseForm({
      item_name: expense.item_name,
      amount: expense.amount,
      category: expense.category,
      notes: expense.notes || ''
    });
  };

  const handleUpdateExpense = async (id) => {
    try {
      await budgetService.updateExpense(id, {
        ...editExpenseForm,
        amount: parseFloat(editExpenseForm.amount)
      });
      notify.success('Expense updated successfully!');
      setEditingExpenseId(null);
      fetchData();
    } catch (error) {
      notify.error('Failed to update expense');
    }
  };

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  if (!summary) return <div className="loading">Loading...</div>;

  return (
    <div className="budget-dashboard">
      <div className="budget-header">
        <h1>💰 Budget Manager</h1>
        <p>Track your food spending and stay within budget</p>
      </div>

      {summary.is_over_budget && (
        <div className="alert alert-danger">
          ⚠️ You've exceeded your budget by {formatCurrency(Math.abs(summary.remaining))}!
        </div>
      )}

      {!summary.is_over_budget && summary.warning_threshold_reached && (
        <div className="alert alert-warning">
          ⚠️ Warning: You've used {summary.percentage_used.toFixed(1)}% of your budget!
        </div>
      )}

      <div className="summary-cards">
        <div className="summary-card budget-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Budget</h3>
            <div className="card-value">{summary.budget ? formatCurrency(summary.budget.amount) : 'Not Set'}</div>
            <div className="card-label">{summary.budget?.period || 'N/A'}</div>
          </div>
          <button className="btn-icon" onClick={() => setShowBudgetForm(!showBudgetForm)}>
            {summary.budget ? '✏️' : '➕'}
          </button>
        </div>

        <div className="summary-card spent-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>Spent</h3>
            <div className="card-value">{formatCurrency(summary.total_spent)}</div>
            <div className="card-label">{summary.expenses_count} expenses</div>
          </div>
        </div>

        <div className={`summary-card remaining-card ${summary.is_over_budget ? 'over-budget' : ''}`}>
          <div className="card-icon">{summary.is_over_budget ? '❌' : '✅'}</div>
          <div className="card-content">
            <h3>Remaining</h3>
            <div className="card-value">{formatCurrency(summary.remaining)}</div>
            <div className="card-label">{summary.percentage_used.toFixed(1)}% used</div>
          </div>
        </div>
      </div>

      {summary.budget && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className={`progress-fill ${summary.is_over_budget ? 'over' : ''}`}
              style={{ width: `${Math.min(summary.percentage_used, 100)}%` }}
            />
          </div>
        </div>
      )}

      {showBudgetForm && (
        <div className="form-card">
          <h2>Set Budget</h2>
          <form onSubmit={handleBudgetSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Period</label>
                <select
                  value={budgetForm.period}
                  onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  value={budgetForm.start_date}
                  onChange={(e) => setBudgetForm({ ...budgetForm, start_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save Budget</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="expenses-section">
        <div className="section-header">
          <h2>📝 Expenses</h2>
          <button className="btn btn-primary" onClick={() => setShowExpenseForm(!showExpenseForm)}>
            ➕ Add Expense
          </button>
        </div>

        {showExpenseForm && (
          <div className="form-card">
            <form onSubmit={handleExpenseSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    value={expenseForm.item_name}
                    onChange={(e) => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                    placeholder="e.g., Groceries"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    placeholder="e.g., Vegetables"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="datetime-local"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add Expense</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="expenses-list">
          {expenses.length === 0 ? (
            <div className="empty-state">No expenses yet. Add your first expense!</div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                {editingExpenseId === expense.id ? (
                  <div className="expense-edit-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Item Name</label>
                        <input
                          type="text"
                          value={editExpenseForm.item_name}
                          onChange={(e) => setEditExpenseForm({ ...editExpenseForm, item_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editExpenseForm.amount}
                          onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <input
                          type="text"
                          value={editExpenseForm.category}
                          onChange={(e) => setEditExpenseForm({ ...editExpenseForm, category: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Notes</label>
                      <input
                        type="text"
                        value={editExpenseForm.notes}
                        onChange={(e) => setEditExpenseForm({ ...editExpenseForm, notes: e.target.value })}
                      />
                    </div>
                    <div className="expense-actions">
                      <button onClick={() => handleUpdateExpense(expense.id)} className="btn btn-success">✔️ Save</button>
                      <button onClick={() => setEditingExpenseId(null)} className="btn btn-secondary">❌ Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="expense-info">
                      <h3>{expense.item_name}</h3>
                      <div className="expense-meta">
                        <span className="badge">{expense.category}</span>
                        <span className="expense-date">{formatDate(expense.date)}</span>
                      </div>
                      {expense.notes && <p className="expense-notes">{expense.notes}</p>}
                    </div>
                    <div className="expense-actions">
                      <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                      <button onClick={() => handleEditExpense(expense)} className="btn-icon">✏️</button>
                      <button className="btn-icon-danger" onClick={() => handleDeleteExpense(expense.id)}>🗑️</button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;
