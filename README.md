# SmartMeal

A full-stack meal planning and inventory management app built with **FastAPI + MongoDB** on the backend and **React + Vite** on the frontend. Features JWT authentication, Google Sign-In via Firebase, an admin dashboard, and a user-facing dashboard with inventory, meal planning, shopping lists, and recommendations.

## Project Structure

```
smartmeal/
├── backend/        # FastAPI server (Python 3.12+)
└── frontend/       # React app (Vite)
```

## Quick Start

### 1. Backend

```powershell
cd smartmeal/backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

API runs at → `http://127.0.0.1:8001`  
Swagger docs → `http://127.0.0.1:8001/docs`

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

App runs at → `http://localhost:7001`

> Make sure the backend is running on port **8001** before using the app.

## Environment

The backend requires a `.env` file at `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=smartmeal
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> **Atlas tips:**
>
> - URL-encode special characters in your password (e.g. `P@ss` → `P%40ss`)
> - Add your machine's IP to **Atlas → Network Access**

## Tech Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Backend  | FastAPI, Motor (async MongoDB), Pydantic v2, passlib, python-jose |
| Database | MongoDB Atlas                                                     |
| Frontend | React 19, React Router v7, Axios, Firebase Auth                   |
| Tooling  | Vite 7, ESLint 9                                                  |

## Key Features

- **Auth**: JWT login/register + Google Sign-In (Firebase)
- **User dashboard**: Inventory tracking, meal planning, shopping lists, recipe recommendations
- **Admin dashboard**: User management, metrics, inventory overview, notifications
- **Dark mode**: System-aware theme toggle
