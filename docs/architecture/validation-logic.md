# Validation Logic Documentation

## Leftover Food Management Validation

### Backend Validation

- Food name: required, trimmed, 1-100 chars
- Quantity: required
- Category: required
- Cooked date: cannot be in the future
- Expiry date: must be after cooked date
- Storage location: fridge, freezer, or room
- Notes: optional, max 500 chars

## Budget Management Validation

### Backend Validation

- Budget amount: must be positive
- Budget period: weekly or monthly only
- Expense item name: required and trimmed
- Expense amount: must be positive
- Expense date: cannot be in the future
- Expense notes: optional, max 500 chars

## Alerts and Business Rules

- Expiring leftovers are highlighted by urgency
- Budget warning threshold triggers at 80%
- Over-budget states are surfaced in the UI

## API Error Behavior

- `400 Bad Request` for invalid data or business-rule violations
- `404 Not Found` when the target item does not exist
- `422 Unprocessable Entity` for schema validation failures
