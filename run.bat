@echo off
echo ==========================================
echo  Starting AI News Suggestor (Full Stack)
echo ==========================================

REM Check virtualenv
if not exist "backend\venv" (
    echo Creating Python virtual environment...
    python -m venv backend\venv
)

echo Activating backend virtual environment...
call backend\venv\Scripts\activate.bat

echo Installing/Verifying backend dependencies...
pip install -r backend\requirements.txt

REM Check node_modules
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend && npm install && cd ..
)

echo Starting Backend Server on http://localhost:8000...
start "AI News Backend" cmd /k "call backend\venv\Scripts\activate.bat && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend Server on http://localhost:5173...
start "AI News Frontend" cmd /k "cd frontend && npm run dev"

echo ==========================================
echo Services launched in separate windows!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ==========================================
