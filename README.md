# Smart Leftover Food Management System

A modern web application to track leftover food items and reduce food waste.

## Tech Stack
- **Frontend**: React 18
- **Backend**: FastAPI (Python 3.11)
- **Database**: MongoDB

## Features
✅ Add leftover food items with details
✅ Track expiry dates and storage locations
✅ Highlight items expiring soon
✅ Mark items as used
✅ Delete leftovers
✅ Modern UI with green-orange-white theme

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Ensure MongoDB is running on `localhost:27017`

4. Start the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run on: http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

Frontend will run on: http://localhost:3000

## API Endpoints

- `POST /api/leftovers` - Create leftover
- `GET /api/leftovers` - Get all leftovers
- `GET /api/leftovers/expiring-soon?days=3` - Get expiring items
- `GET /api/leftovers/{id}` - Get single leftover
- `PUT /api/leftovers/{id}` - Update leftover
- `PATCH /api/leftovers/{id}/mark-used` - Mark as used
- `DELETE /api/leftovers/{id}` - Delete leftover

## MongoDB Schema

```javascript
{
  _id: ObjectId,
  name: String,
  quantity: String,
  category: String,
  cooked_date: DateTime,
  expiry_date: DateTime,
  storage_location: "fridge" | "freezer",
  notes: String,
  is_used: Boolean,
  created_at: DateTime
}
```

## Color Theme
- Primary Green: #4caf50
- Accent Orange: #ff9800
- Background White: #ffffff
- Gradients for modern look
