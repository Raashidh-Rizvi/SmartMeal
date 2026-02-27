# Budget Management Module

## MongoDB Schema

### Budget Collection
```javascript
{
  _id: ObjectId,
  amount: Number,
  period: "weekly" | "monthly",
  start_date: DateTime,
  created_at: DateTime
}
```

### Expenses Collection
```javascript
{
  _id: ObjectId,
  item_name: String,
  amount: Number,
  category: String,
  date: DateTime,
  notes: String,
  created_at: DateTime
}
```

## API Endpoints

### Budget Endpoints
- `POST /api/budget/budgets` - Create new budget
- `GET /api/budget/budgets/current` - Get current budget
- `PUT /api/budget/budgets/{id}` - Update budget
- `DELETE /api/budget/budgets/{id}` - Delete budget

### Expense Endpoints
- `POST /api/budget/expenses` - Add expense
- `GET /api/budget/expenses` - Get all expenses (with filters)
- `GET /api/budget/expenses/{id}` - Get single expense
- `PUT /api/budget/expenses/{id}` - Update expense
- `DELETE /api/budget/expenses/{id}` - Delete expense

### Summary Endpoint
- `GET /api/budget/summary` - Get budget summary with calculations

## Summary Response
```json
{
  "budget": {
    "id": "...",
    "amount": 500.00,
    "period": "monthly",
    "start_date": "2024-01-01T00:00:00",
    "created_at": "2024-01-01T00:00:00"
  },
  "total_spent": 350.50,
  "remaining": 149.50,
  "expenses_count": 15,
  "is_over_budget": false,
  "percentage_used": 70.10
}
```

## Features
✅ Set weekly/monthly budget
✅ Track expenses with categories
✅ Real-time budget calculations
✅ Visual progress bar
✅ Over-budget alerts
✅ Expense filtering by date/category
✅ Modern dashboard UI

## Usage

Import BudgetDashboard in your main App:
```javascript
import BudgetDashboard from './components/BudgetDashboard';

function App() {
  return <BudgetDashboard />;
}
```
