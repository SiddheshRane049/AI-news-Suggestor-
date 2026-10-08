#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Starting AI News Suggestor (Full Stack) "
echo "=========================================="

# Create Python virtual environment if not exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

source backend/venv/bin/activate
echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "Starting Backend API on http://localhost:8000..."
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting Frontend Dev Server on http://localhost:5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "Both services are running!"
echo "Frontend: http://localhost:5173"
echo "Backend Docs: http://localhost:8000/docs"
wait
