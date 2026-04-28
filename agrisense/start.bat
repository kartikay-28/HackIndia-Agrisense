@echo off
setlocal enabledelayedexpansion
title AgriSense Launcher
color 0A

echo.
echo  ============================================================
echo   AgriSense - AI-Powered Agricultural Intelligence
echo  ============================================================
echo.

:: Store root dir (where this bat lives), strip trailing backslash
set "ROOT=%~dp0"
if "!ROOT:~-1!"=="\" set "ROOT=!ROOT:~0,-1!"

set "BACKEND=!ROOT!\backend"
set "FRONTEND=!ROOT!\frontend"
set "VENV=!BACKEND!\venv"
set "PY=!VENV!\Scripts\python.exe"
set "PIP=!VENV!\Scripts\pip.exe"

:: ── Check Python ──────────────────────────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Python not found.
    echo  Install from https://www.python.org/downloads/
    echo  Check "Add Python to PATH" during install.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo  %%v found

:: ── Check Node.js ─────────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js not found.
    echo  Install from https://nodejs.org/
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo  Node.js %%v found

echo.
echo  ============================================================
echo   BACKEND SETUP
echo  ============================================================

:: ── [1] Virtual environment ───────────────────────────────────
echo.
echo  [1/6] Checking Python virtual environment...
if not exist "!VENV!\Scripts\activate.bat" (
    echo        Creating virtual environment...
    python -m venv "!VENV!"
    if !errorlevel! neq 0 (
        echo  [ERROR] Failed to create venv.
        pause & exit /b 1
    )
    echo        Created.
) else (
    echo        Already exists.
)

:: ── [2] Install dependencies ──────────────────────────────────
echo.
echo  [2/6] Installing Python dependencies...
"!PIP!" install --upgrade pip --quiet --disable-pip-version-check 2>nul
"!PIP!" install -r "!BACKEND!\requirements.txt" --disable-pip-version-check
if !errorlevel! neq 0 (
    echo  [WARNING] Some packages had issues. Continuing anyway...
)
echo        Dependencies ready.

:: ── [3] .env file ─────────────────────────────────────────────
echo.
echo  [3/6] Checking .env configuration...
if not exist "!BACKEND!\.env" (
    copy "!BACKEND!\.env.example" "!BACKEND!\.env" >nul
    echo        .env created from template.
    echo        Edit !BACKEND!\.env with your API keys then press any key.
    pause >nul
) else (
    echo        .env found.
)

:: ── [4] Train ML models ───────────────────────────────────────
echo.
echo  [4/6] Checking ML models...
if not exist "!BACKEND!\app\ml_models\crop_model.pkl" (
    echo        Training ML models - first run only, ~30 seconds...
    pushd "!BACKEND!"
    "!PY!" scripts\train_models.py
    popd
    if !errorlevel! neq 0 (
        echo  [WARNING] ML training failed. App will use fallback data.
    ) else (
        echo        ML models trained.
    )
) else (
    echo        ML models already exist.
)

:: ── [5] Seed database ─────────────────────────────────────────
echo.
echo  [5/6] Seeding database...
pushd "!BACKEND!"
"!PY!" scripts\seed_data.py
popd
if !errorlevel! neq 0 (
    echo  [WARNING] Seeding failed. Check DATABASE_URL in .env
) else (
    echo        Database seeded.
)

:: ── [6] Launch backend ────────────────────────────────────────
echo.
echo  [6/6] Launching FastAPI backend on http://localhost:8000 ...
set "BACKEND_CMD=call "!VENV!\Scripts\activate.bat" && cd /d "!BACKEND!" && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
start "AgriSense Backend :8000" cmd /k "color 0B && echo AgriSense Backend && echo. && !BACKEND_CMD!"
echo        Backend window opened.

echo.
echo  Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo  ============================================================
echo   FRONTEND SETUP
echo  ============================================================

:: ── [1] npm install ───────────────────────────────────────────
echo.
echo  [1/2] Checking npm packages...
if not exist "!FRONTEND!\node_modules" (
    echo        Installing npm packages - first run ~2 minutes...
    pushd "!FRONTEND!"
    npm install --legacy-peer-deps
    set NPM_EXIT=!errorlevel!
    popd
    :: npm audit warnings cause non-zero exit — only fail on real errors
    if !NPM_EXIT! gtr 1 (
        echo  [ERROR] npm install failed with exit code !NPM_EXIT!
        pause & exit /b 1
    )
    echo        npm packages installed.
) else (
    echo        node_modules already exists.
)

:: ── Frontend .env.local ───────────────────────────────────────
if not exist "!FRONTEND!\.env.local" (
    echo.
    echo        Creating frontend .env.local...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:8000
        echo NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
    ) > "!FRONTEND!\.env.local"
    echo        .env.local created.
)

:: ── [2] Launch frontend ───────────────────────────────────────
echo.
echo  [2/2] Launching Next.js frontend on http://localhost:3000 ...
start "AgriSense Frontend :3000" cmd /k "color 0D && echo AgriSense Frontend && echo. && cd /d "!FRONTEND!" && npm run dev"
echo        Frontend window opened.

:: ── Done ──────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   AgriSense is starting up!
echo  ============================================================
echo.
echo   Backend  API  -^>  http://localhost:8000
echo   API Docs      -^>  http://localhost:8000/docs
echo   Frontend App  -^>  http://localhost:3000
echo.
echo  Waiting 15 seconds for Next.js to compile...
timeout /t 15 /nobreak >nul

echo.
echo  Opening browser...
start "" "http://localhost:3000"

echo.
echo  Both servers are running in their own windows.
echo  Close those windows to stop the servers.
echo.
pause
