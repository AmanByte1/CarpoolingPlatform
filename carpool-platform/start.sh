#!/usr/bin/env bash
# Commute - Enterprise Carpooling Platform launcher (Mac/Linux)
set -e

echo "============================================"
echo "  Commute - Enterprise Carpooling Platform"
echo "============================================"
echo

if ! command -v node &> /dev/null; then
  echo "[ERROR] Node.js is not installed or not in PATH."
  echo "Install Node.js 18+ from https://nodejs.org and run this again."
  exit 1
fi

echo "[1/4] Checking backend configuration..."
cd backend
if [ ! -f ".env" ]; then
  echo "  No .env found - creating one from .env.example"
  cp .env.example .env
  echo
  echo "  IMPORTANT: Set MONGO_URI in backend/.env to your MongoDB connection"
  echo "  string (local mongod or MongoDB Atlas), then save and re-run this script."
  ${EDITOR:-nano} .env
fi

if [ ! -d "node_modules" ]; then
  echo "  Installing backend dependencies..."
  npm install
fi

echo
echo "[2/4] Seeding demo data..."
npm run seed || echo "  [WARNING] Seeding failed - check MongoDB is running and MONGO_URI is correct, then re-run this script."

cd ../frontend
echo
echo "[3/4] Checking frontend dependencies..."
if [ ! -d "node_modules" ]; then
  echo "  Installing frontend dependencies..."
  npm install
fi
cd ..

echo
echo "[4/4] Starting servers..."
(cd backend && npm run dev) &
BACKEND_PID=$!
sleep 3
(cd frontend && npm run dev) &
FRONTEND_PID=$!

sleep 3
if command -v open &> /dev/null; then open http://localhost:5173
elif command -v xdg-open &> /dev/null; then xdg-open http://localhost:5173
fi

echo
echo "============================================"
echo "  Commute is running!"
echo "  Frontend:    http://localhost:5173"
echo "  Backend API: http://localhost:5000/api/health"
echo "  Press Ctrl+C to stop both servers."
echo "============================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
