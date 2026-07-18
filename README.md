# CarpoolingPlatform

This repository contains the CommuteFlow carpooling platform project inside the `fi` directory.

## PostgreSQL Setup and Run

1. Open the `fi` folder in your terminal:

```powershell
cd d:\CarpoolingPlatform\fi
```

2. Install dependencies:

```powershell
npm install
```

3. Create the PostgreSQL database:

```sql
create database commuteflow;
```

4. Copy `.env.example` to `.env` and update the `DATABASE_URL` with your PostgreSQL credentials.

5. Run the database schema and seed data:

```powershell
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/commuteflow"
npm run db:schema
npm run db:seed
```

6. Start the backend server:

```powershell
npm run dev
```

7. Open the app:

```text
http://127.0.0.1:5173
```
