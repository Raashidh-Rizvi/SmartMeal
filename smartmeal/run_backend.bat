@echo off
REM Run the FastAPI backend server
cd /d "%~dp0\backend"
set PYTHONPATH=%CD%
call .\.venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --port 8001
