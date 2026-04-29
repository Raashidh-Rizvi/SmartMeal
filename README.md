# SmartMeal

SmartMeal is a full-stack meal planning and inventory management application built with a FastAPI backend, a React + Vite frontend, and MongoDB.

## Repository Structure

```text
docs/
|-- architecture/   # Feature and validation notes
|-- reports/        # Evaluation and report artifacts
infra/
|-- docker/         # Docker Compose and local container orchestration files
|-- railway/        # Railway deployment configuration
smartmeal/
|-- backend/        # FastAPI service
|   |-- app/        # Application code
|   `-- scripts/    # Operational utilities such as data seeding
`-- frontend/       # React + Vite application
```

## Quick Start

### Backend

```powershell
cd smartmeal/backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

- API root: `http://127.0.0.1:8001`
- Swagger docs: `http://127.0.0.1:8001/docs`

### Frontend

```powershell
cd smartmeal/frontend
npm install
npm run dev
```

- App URL: `http://localhost:7001`

Make sure the backend is running on port `8001` before using the app.

## Environment

Create `smartmeal/backend/.env` with values like:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=smartmeal
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Deployment and Operations

- Docker Compose: `infra/docker/docker-compose.yml`
- Railway config: `infra/railway/railway.json`
- Backend seed script: `smartmeal/backend/scripts/seed_all.py`
- Project documentation index: `docs/README.md`

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | FastAPI, Motor, Pydantic v2, passlib, python-jose |
| Database | MongoDB Atlas |
| Frontend | React 19, React Router v7, Axios, Firebase Auth |
| Tooling | Vite 7, ESLint 9, Docker Compose |

## Key Features

- JWT login/register and Google Sign-In
- Inventory, meal planning, shopping list, leftovers, and budget workflows
- Recipe recommendations and AI-assisted recipe experiences
- Admin dashboard for monitoring and management
