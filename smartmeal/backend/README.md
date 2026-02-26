# SmartMeal Backend Server

This is the backend repository for the SmartMeal application. It is constructed using FastAPI and relies on MongoDB for data storage.

## Requirements

- Python 3.10+
- A running MongoDB instance or MongoDB Atlas Connection String

## Installation & Setup

We recommend utilizing the **project-level `.venv` virtual environment**.

1. **Activate the Virtual Environment from the Root Directory:**
   In your VS Code terminal (or standard terminal), run this from the `d:\Project\SmartRecipe` directory:
   - On **Windows** (PowerShell):
     ```powershell
     & d:\Project\SmartRecipe\.venv\Scripts\Activate.ps1
     ```

   If you see `(.venv)` at the start of your terminal prompt, you are activated.

2. **Navigate into the Backend Directory:**

   ```bash
   cd d:\Project\SmartRecipe\smartmeal\backend
   ```

3. **Install Dependencies:**
   Run pip using the Python module syntax to ensure it uses the activated `.venv`:

   ```bash
   python -m pip install -r requirements.txt
   ```

4. **Environment Configuration:**
   Ensure you have a `.env` file located in the root of the `backend` directory. The file should contain your environment variables, including:
   ```env
   # Example .env configuration
   MONGODB_URI=mongodb+srv://<db_user>:<password>@cluster.mongodb.net/
   MONGODB_DB_NAME=smartmeal
   SECRET_KEY=your-secret-key-change-in-production
   ```

## Running the Development Server

Start the application utilizing **Uvicorn** with hot-reloading enabled. Run this from inside the `backend` folder while your virtual environment is active:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

- The API server will start on `http://127.0.0.1:8001`.
- The interactive Swagger documentation is accessible at `http://127.0.0.1:8001/docs`.
- Redoc documentation is available at `http://127.0.0.1:8001/redoc`.
