# SmartMeal Backend

FastAPI backend for SmartMeal. It connects to MongoDB Atlas through Motor and exposes authentication, inventory, meal planning, recommendations, leftovers, budgeting, shopping list, and admin APIs.

## Stack

- Python 3.12+
- FastAPI
- Motor
- Pydantic v2
- passlib + bcrypt
- python-jose
- Firebase Admin SDK
- MongoDB Atlas

## Setup

### 1. Activate the virtual environment

```powershell
cd smartmeal/backend
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment variables

Create `smartmeal/backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=smartmeal
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 4. Run the development server

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

- API root: `http://127.0.0.1:8001/`
- Swagger UI: `http://127.0.0.1:8001/docs`
- ReDoc: `http://127.0.0.1:8001/redoc`

## Project Structure

```text
backend/
|-- app/
|   |-- api/
|   |-- core/
|   |-- db/
|   |-- models/
|   |-- routes/
|   |-- schemas/
|   |-- services/
|   `-- utils/
|-- scripts/
|   `-- seed_all.py
|-- requirements.txt
`-- README.md
```

## Operational Scripts

Run the seed utility from the backend directory:

```powershell
python scripts/seed_all.py
```

## Notes

- Default allowed frontend origins are configured in `smartmeal/backend/app/main.py`.
- Google Sign-In uses Firebase Admin verification on the backend.
- Recommendation and AI-related behavior lives under `smartmeal/backend/app/services/`.
