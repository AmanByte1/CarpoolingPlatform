# Commute — Enterprise Carpooling Platform

Full-stack hackathon project: **React (Vite + Tailwind + Framer Motion)** frontend, **Node/Express + MongoDB (Mongoose)** backend, **Socket.IO** for live GPS tracking and in-trip chat, free **OpenStreetMap/Leaflet** maps (no API key needed), and a mock **Razorpay test-mode** wallet/payment flow.

## Folder structure
```
carpool-platform/
  backend/     Node + Express + MongoDB API, JWT auth, Socket.IO
  frontend/    React app (Vite)
```

## 1. Prerequisites
- Node.js 18+
- A MongoDB instance — either:
  - Local: install MongoDB Community Server and run `mongod`, or
  - Free cloud: create a free cluster at MongoDB Atlas and copy its connection string

## 2. Backend setup
```bash
cd backend
cp .env.example .env
# edit .env -> set MONGO_URI to your local or Atlas connection string, and set a random JWT_SECRET
npm install
npm run seed     # creates demo organization, admin, drivers, passenger and sample rides
npm run dev       # starts API on http://localhost:5000
```
Demo login (after seeding):
- Org code: `ACME01`
- Admin: `admin@acme.com` / `password123`
- Driver: `driver1@acme.com` / `password123` (also driver2/3/4)
- Passenger: `meera@acme.com` / `password123`

## 3. Frontend setup
Open a second terminal:
```bash
cd frontend
npm install
npm run dev       # starts app on http://localhost:5173
```
Vite proxies `/api` and `/socket.io` to `http://localhost:5000`, so just open http://localhost:5173.

## 4. Try the full workflow
1. Log in as `driver1@acme.com` → **Offer a Ride** → register/select a vehicle → pick pickup/destination (type an address, results come from free OpenStreetMap search) → confirm route → publish.
2. Log in as `meera@acme.com` (another browser/incognito tab) → **Find a Ride** → same route/time → book a seat.
3. Back as the driver → **My Trips** → open the trip → **Start trip** (shares live location over Socket.IO; falls back to a simulated path if you deny browser location) → chat with the passenger.
4. Complete the trip → passenger pays via Wallet/UPI/Card/Cash (mock Razorpay test mode) → both see it in **Ride History** and **Reports & Analytics**.
5. Log in as `admin@acme.com` → **Admin Console** → manage employees, view org-wide stats, configure fuel/cost settings.

## Machine Learning features
- **Smart Ride Match Score** (`backend/ml/matchScore.js`): ranks Find-a-Ride results with a weighted multi-signal scoring model — pickup/destination proximity, time proximity, driver rating, fare competitiveness, and a collaborative "have you ridden with this driver before" signal — shown as an "X% Match" badge on each ride card, instead of plain distance sorting.
- **AI Fare Predictor** (`backend/ml/farePredictor.js` + `backend/ml/ridgeRegression.js`): a ridge (L2-regularized) linear regression, trained live at request time on the organization's own historical `farePerSeat` vs. `distanceKm`/peak-hour data, suggests a fare per seat in the Offer Ride flow. Falls back to a simple cost-per-km baseline until an org has at least 5 completed rides (cold start), so it works out of the box and gets smarter with real usage.
- Both are pure JavaScript (no external ML services/API keys), so they run entirely inside the existing Node backend.

## Notes on this sandbox
- All backend code was syntax-checked and its Mongoose models/routes reviewed end-to-end; a live MongoDB connection could not be tested from this sandbox (outbound network here is restricted and can't reach MongoDB Atlas or download the MongoDB binary). It will connect normally on your machine once `MONGO_URI` points to a real MongoDB instance.
- The frontend was installed and **production-built successfully with zero errors** in this sandbox.
- Maps use free OpenStreetMap tiles + Nominatim search (no Google Maps API key required), so it works out of the box. Swap in Google Maps later if you prefer.
- Payments use a mock Razorpay test-mode flow per the hackathon assumptions — no real gateway keys needed.

## Tech stack
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, React Router, react-leaflet, Recharts, Socket.IO client, lucide-react icons
- **Backend:** Node.js, Express, Mongoose (MongoDB), JWT + bcrypt auth, Socket.IO
