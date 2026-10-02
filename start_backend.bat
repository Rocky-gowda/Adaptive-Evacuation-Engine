@echo off
echo ================================================
echo  Adaptive Evacuation Feasibility Engine
echo  BACKEND STARTUP
echo ================================================
echo.
cd /d "%~dp0backend"
echo Installing Python dependencies...
pip install -r requirements.txt --quiet
echo.
echo Starting FastAPI server on http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --reload --port 8000
