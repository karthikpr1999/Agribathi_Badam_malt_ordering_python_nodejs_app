@echo off
cd /d "%~dp0"
echo Starting Agribathi Order Backend on http://localhost:8000
echo API docs available at http://localhost:8000/docs
echo Press Ctrl+C to stop.
echo.
call venv\Scripts\activate.bat
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
