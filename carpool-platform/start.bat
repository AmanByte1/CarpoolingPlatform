@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Commute - Enterprise Carpooling Platform
echo ============================================
echo.

:: --- Check Node.js is installed ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ from https://nodejs.org and run this again.
    pause
    exit /b 1
)

:: --- Backend: .env setup ---
echo [1/4] Checking backend configuration...
cd backend

if not exist ".env" (
    echo   No .env found - creating one from .env.example
    copy .env.example .env >nul
    echo.
    echo   IMPORTANT: Set MONGO_URI in backend\.env to your MongoDB connection
    echo   string ^(local mongod or MongoDB Atlas^), then save and close Notepad
    echo   to continue.
    echo.
    notepad .env
)

:: --- Backend: install dependencies ---
if not exist "node_modules" (
    echo   Installing backend dependencies... ^(this can take a minute^)
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Backend "npm install" failed. See the messages above.
        pause
        exit /b 1
    )
)

:: --- Backend: seed demo data (safe to re-run) ---
echo.
echo [2/4] Seeding demo data...
call npm run seed
if %errorlevel% neq 0 (
    echo.
    echo   [WARNING] Seeding failed - this usually means MongoDB is not
    echo   running or MONGO_URI in backend\.env is incorrect.
    echo   Fix that, then just run start.bat again.
    echo.
)

cd ..

:: --- Frontend: install dependencies ---
echo [3/4] Checking frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo   Installing frontend dependencies... ^(this can take a minute^)
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend "npm install" failed. See the messages above.
        pause
        exit /b 1
    )
)
cd ..

:: --- Launch both servers in their own windows ---
echo.
echo [4/4] Starting servers...
start "Commute Backend  - http://localhost:5000" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Commute Frontend - http://localhost:5173" cmd /k "cd frontend && npm run dev"

timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo ============================================
echo   Commute is starting up!
echo   Frontend:    http://localhost:5173
echo   Backend API: http://localhost:5000/api/health
echo.
echo   Two new windows opened for the backend and
echo   frontend servers - just close them to stop.
echo   This window can be closed safely.
echo ============================================
pause
