# Smart Meal Planner

Full-stack app:
- **Frontend**: Vite + React (`frontend/`)
- **Backend**: FastAPI + MongoDB (`backend/`)

## Prerequisites
- Node.js (for frontend)
- Python 3.x (for backend)
- MongoDB running locally or Atlas

## Setup

### 1) MongoDB
Update `backend/.env` (see `backend/.env.example`).

### 2) Backend

```bash
cd backend
venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: `http://127.0.0.1:8000/docs`

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

