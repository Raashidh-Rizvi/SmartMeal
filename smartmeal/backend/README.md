<<<<<<< HEAD
# SmartMeal — Backend

FastAPI backend for SmartMeal. Connects to MongoDB Atlas via Motor (async driver). Supports JWT authentication, Google / Firebase sign-in, and a full admin API.

## Stack

- **Python 3.12+** (tested on 3.14)
- **FastAPI** — API framework
- **Motor** — async MongoDB driver
- **Pydantic v2** — request/response validation
- **passlib + bcrypt** — password hashing
- **python-jose** — JWT tokens
- **Firebase Admin SDK** — Google ID token verification
- **certifi** — TLS certificates for MongoDB Atlas
- **MongoDB Atlas** — hosted database
=======
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

## Setup

### 1. Activate the virtual environment

<<<<<<< HEAD
From the backend directory:

```powershell
cd d:\Project\SmartRecipe\smartmeal\backend
.\.venv\Scripts\Activate.ps1
```

> If you get an execution policy error:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

=======
```powershell
cd smartmeal/backend
.\.venv\Scripts\Activate.ps1
```

>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment variables

<<<<<<< HEAD
Create a `.env` file in `backend/`:
=======
Create `smartmeal/backend/.env`:
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=smartmeal
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

<<<<<<< HEAD
> **Atlas tips:**
>
> - URL-encode special characters in your password (e.g. `P@ss` → `P%40ss`)
> - Go to **Atlas → Network Access** and add your IP to the allowlist

=======
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
### 4. Run the development server

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

<<<<<<< HEAD
| Endpoint   | URL                           |
| ---------- | ----------------------------- |
| API root   | `http://127.0.0.1:8001/`      |
| Swagger UI | `http://127.0.0.1:8001/docs`  |
| ReDoc      | `http://127.0.0.1:8001/redoc` |

## API Routes

### Auth — `/api/auth`

| Method | Path                 | Description                            |
| ------ | -------------------- | -------------------------------------- |
| POST   | `/api/auth/register` | Register a new user (email + password) |
| POST   | `/api/auth/login`    | Login → returns JWT access token       |
| GET    | `/api/auth/me`       | Get current authenticated user         |
| POST   | `/api/auth/google`   | Verify Firebase ID token, sync user    |

### Users — `/api/users`

| Method | Path                     | Description        |
| ------ | ------------------------ | ------------------ |
| PUT    | `/api/users/me`          | Update profile     |
| PUT    | `/api/users/me/password` | Change password    |
| DELETE | `/api/users/me`          | Delete own account |

### Admin — `/api/admin`

| Method | Path                       | Description         |
| ------ | -------------------------- | ------------------- |
| GET    | `/api/admin/users`         | List all users      |
| GET    | `/api/admin/metrics`       | Dashboard metrics   |
| GET    | `/api/admin/inventory`     | All inventory items |
| POST   | `/api/admin/notifications` | Send a notification |

## Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app + lifespan + CORS
│   ├── api/
│   │   └── deps.py                # Auth dependencies (get_current_user, require_admin)
│   ├── core/
│   │   ├── config.py              # Settings loaded from .env
│   │   └── security.py            # Password hashing, JWT creation/verification
│   ├── db/
│   │   ├── database.py            # Motor client, connect/close, get_db()
│   │   └── init_db.py             # Index creation on startup
│   ├── models/
│   │   ├── user.py                # Pydantic models (UserInDB, UserResponse, etc.)
│   │   ├── inventory_models.py    # Inventory item models
│   │   └── notification_models.py # Notification models
│   ├── routes/
│   │   ├── auth.py                # /api/auth/* endpoints
│   │   ├── users.py               # /api/users/* endpoints
│   │   └── admin_routes.py        # /api/admin/* endpoints
│   └── services/                  # Business logic (domain service modules go here)
├── requirements.txt
└── .env                           # Not committed — create locally
```

## CORS

The following origins are allowed by default (configured in `app/main.py`):

- `http://localhost:7001` (Vite dev server)
- `http://localhost:3000`
- `http://localhost:5173`

## Notes

- **Google Sign-In**: The `/api/auth/google` endpoint expects a Firebase `id_token` in the request body. It verifies the token with Firebase Admin SDK and creates or syncs the user in MongoDB.
- **TLS / MongoDB Atlas**: The Motor client uses `tls=True` with `tlsCAFile=certifi.where()` for compatibility with Python 3.14+ and OpenSSL 3.x.
=======
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
