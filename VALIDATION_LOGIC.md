# Validation Logic Documentation

## ✅ Leftover Food Management Validation

### Backend Validation (Pydantic)

**Create Leftover:**
- ✅ Food name: Required, 1-100 chars, trimmed
- ✅ Quantity: Required, min 1 char
- ✅ Category: Required, min 1 char
- ✅ Cooked date: Cannot be future
- ✅ Expiry date: Must be after cooked date
- ✅ Storage: fridge/freezer/room only
- ✅ Notes: Optional, max 500 chars

**Update Leftover:**
- ✅ Cooked date: Cannot be future
- ✅ Expiry validation: Checks against existing cooked date
- ✅ Cross-field validation when updating dates

**Code Example:**
```python
@field_validator('cooked_date')
@classmethod
def cooked_date_not_future(cls, v):
    if v > datetime.now():
        raise ValueError('Cooked date cannot be in the future')
    return v

@field_validator('expiry_date')
@classmethod
def expiry_after_cooked(cls, v, info):
    if 'cooked_date' in info.data and v <= info.data['cooked_date']:
        raise ValueError('Expiry date must be after cooked date')
    return v
```

## ✅ Budget Management Validation

### Backend Validation (Pydantic)

**Budget:**
- ✅ Amount: Must be > 0
- ✅ Period: weekly/monthly only
- ✅ Automatic rounding to 2 decimals

**Expense:**
- ✅ Item name: Required, 1-100 chars, trimmed
- ✅ Amount: Must be > 0, rounded to 2 decimals
- ✅ Category: Required, 1-50 chars, trimmed
- ✅ Date: Cannot be future
- ✅ Notes: Optional, max 500 chars

**Code Example:**
```python
@field_validator('amount')
@classmethod
def amount_positive(cls, v):
    if v <= 0:
        raise ValueError('Amount must be positive')
    return round(v, 2)

@field_validator('date')
@classmethod
def date_not_future(cls, v):
    if v > datetime.now():
        raise ValueError('Expense date cannot be in the future')
    return v
```

## ⚠️ Smart Alerts & Business Rules

### Leftover Alerts
- ✅ Items expiring within 3 days highlighted
- ✅ Color-coded by urgency (green/orange/red)
- ✅ Expired items marked clearly

### Budget Alerts
- ✅ **80% Warning Threshold**: Alert when spending reaches 80% of budget
- ✅ **Over Budget Alert**: Red alert when budget exceeded
- ✅ Visual progress bar with color change

**Implementation:**
```python
warning_threshold_reached = percentage_used >= 80
```

## 🎯 Frontend Validation

### HTML5 Validation
- Required fields
- Number inputs with step="0.01"
- Min/max length enforcement
- datetime-local for date inputs

### User Experience
- Real-time error messages from backend
- Alert dialogs for critical actions
- Visual feedback (colors, badges)
- Disabled states for invalid forms

## 📊 Data Integrity

### Soft Delete Pattern
- ✅ Mark as "used" instead of hard delete
- ✅ Preserves history for analytics
- ✅ Can filter out used items

### Calculation Accuracy
- ✅ All amounts rounded to 2 decimals
- ✅ Days until expiry calculated dynamically
- ✅ Budget percentage calculated accurately

## 🚀 API Error Responses

**400 Bad Request:**
- Invalid data format
- Validation failures
- Business rule violations

**404 Not Found:**
- Item doesn't exist

**422 Unprocessable Entity:**
- Pydantic validation errors (automatic)

Example error response:
```json
{
  "detail": [
    {
      "loc": ["body", "amount"],
      "msg": "Amount must be positive",
      "type": "value_error"
    }
  ]
}
```
