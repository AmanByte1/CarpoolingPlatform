# CommuteFlow Carpooling Platform

Full-stack enterprise carpooling project from the PDF brief.

## Stack

- Frontend: React browser app with CSS and anime.js animations
- Backend: Node.js + Express
- Database: PostgreSQL

## Run In VS Code

1. Open this folder:

```text
C:\Users\aman\Documents\Codex\2026-07-18\fi
```

2. Install backend packages:

```powershell
npm install
```

3. Create PostgreSQL database:

```sql
create database commuteflow;
```

4. Copy `.env.example` to `.env`, then update the connection string with your PostgreSQL username and password:

```text
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/commuteflow
JWT_SECRET=change-this-secret-before-production
PORT=5173
```

5. Run database schema and seed data:

```powershell
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/commuteflow"
npm run db:schema
npm run db:seed
```

6. Start the full project:

```powershell
npm run dev
```

7. Open:

```text
http://127.0.0.1:5173
```

## Demo Login

All seeded users use password:

```text
commuteflow
```

Employee:

```text
employee@company.com
```

Admin:

```text
admin@company.com
```

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profile`
- `GET /api/rides`
- `POST /api/rides`
- `POST /api/bookings`
- `GET /api/trips`
- `PATCH /api/trips/:id/status`
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/wallet`
- `POST /api/wallet/recharge`
- `POST /api/payments`
- `GET /api/history`
- `GET /api/reports`
- `GET /api/admin/summary`







