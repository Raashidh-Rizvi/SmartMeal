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

- Set weekly or monthly budgets
- Track categorized expenses
- Compute real-time remaining budget
- Show visual progress and over-budget alerts
- Filter expenses by date and category
