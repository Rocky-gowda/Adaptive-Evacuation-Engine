@echo off
echo ================================================
echo  Adaptive Evacuation Feasibility Engine
echo  FRONTEND STARTUP
echo ================================================
echo.
cd /d "%~dp0frontend"
echo Installing Node dependencies...
npm install
echo.
echo Starting React dev server on http://localhost:5173
echo.
npm run dev
