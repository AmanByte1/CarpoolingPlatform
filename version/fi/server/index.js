require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./db');
const { requireAuth } = require('./middleware/auth');

const app = express();
const port = Number(process.env.PORT || 5173);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function signUser(user) {
  return jwt.sign(
    {
      id: user.id,
      organizationId: user.organization_id,
      role: user.role,
      name: user.full_name,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

app.get('/api/health', async (_req, res) => {
  const db = await query('select now() as now');
  res.json({ ok: true, service: 'commuteflow-api', databaseTime: db.rows[0].now });
});

app.post('/api/auth/register', async (req, res) => {
  const { organizationName, fullName, email, password, phone, role = 'employee' } = req.body;
  if (!organizationName || !fullName || !email || !password) {
    return res.status(400).json({ message: 'Organization, name, email, and password are required.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const clientOrganization = await query(
    `insert into organizations (name)
     values ($1)
     on conflict (name) do update set name = excluded.name
     returning id, name`,
    [organizationName]
  );

  const user = await query(
    `insert into users (organization_id, full_name, email, password_hash, phone, role)
     values ($1, $2, lower($3), $4, $5, $6)
     returning id, organization_id, full_name, email, phone, role`,
    [clientOrganization.rows[0].id, fullName, email, passwordHash, phone || null, role]
  );

  res.status(201).json({ user: user.rows[0], token: signUser(user.rows[0]) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await query(
    'select id, organization_id, full_name, email, password_hash, phone, role from users where email = lower($1)',
    [email]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  delete user.password_hash;
  res.json({ user, token: signUser(user) });
});

app.get('/api/profile', requireAuth, async (req, res) => {
  const result = await query(
    `select u.id, u.full_name, u.email, u.phone, u.role, o.name as organization
     from users u
     join organizations o on o.id = u.organization_id
     where u.id = $1`,
    [req.user.id]
  );
  res.json(result.rows[0]);
});

app.get('/api/rides', requireAuth, async (req, res) => {
  const { pickup, destination, date } = req.query;
  const params = [req.user.organizationId];
  const where = ['r.organization_id = $1', "r.status = 'published'"];

  if (pickup) {
    params.push(`%${pickup}%`);
    where.push(`r.pickup_location ilike $${params.length}`);
  }
  if (destination) {
    params.push(`%${destination}%`);
    where.push(`r.destination ilike $${params.length}`);
  }
  if (date) {
    params.push(date);
    where.push(`r.travel_date = $${params.length}`);
  }

  const result = await query(
    `select r.*, u.full_name as driver_name, v.model as vehicle_model, v.registration_number
     from rides r
     join users u on u.id = r.driver_id
     join vehicles v on v.id = r.vehicle_id
     where ${where.join(' and ')}
     order by r.travel_date, r.travel_time`,
    params
  );
  res.json(result.rows);
});

app.post('/api/rides', requireAuth, async (req, res) => {
  const { vehicleId, pickupLocation, destination, travelDate, travelTime, availableSeats, farePerSeat, recurring } = req.body;
  if (!vehicleId || !pickupLocation || !destination || !travelDate || !travelTime || !availableSeats || !farePerSeat) {
    return res.status(400).json({ message: 'Missing ride details.' });
  }

  const result = await query(
    `insert into rides
      (organization_id, driver_id, vehicle_id, pickup_location, destination, travel_date, travel_time, available_seats, fare_per_seat, recurring)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     returning *`,
    [
      req.user.organizationId,
      req.user.id,
      vehicleId,
      pickupLocation,
      destination,
      travelDate,
      travelTime,
      availableSeats,
      farePerSeat,
      Boolean(recurring)
    ]
  );
  res.status(201).json(result.rows[0]);
});

app.post('/api/bookings', requireAuth, async (req, res) => {
  const { rideId, seats = 1 } = req.body;
  const ride = await query('select available_seats, fare_per_seat from rides where id = $1 and organization_id = $2', [
    rideId,
    req.user.organizationId
  ]);

  if (!ride.rows[0]) {
    return res.status(404).json({ message: 'Ride not found.' });
  }
  if (ride.rows[0].available_seats < seats) {
    return res.status(409).json({ message: 'Not enough seats available.' });
  }

  const totalFare = Number(ride.rows[0].fare_per_seat) * Number(seats);
  const booking = await query(
    `insert into bookings (ride_id, passenger_id, seats_booked, total_fare)
     values ($1, $2, $3, $4)
     returning *`,
    [rideId, req.user.id, seats, totalFare]
  );

  await query('update rides set available_seats = available_seats - $1 where id = $2', [seats, rideId]);
  res.status(201).json(booking.rows[0]);
});

app.get('/api/trips', requireAuth, async (req, res) => {
  const result = await query(
    `select t.*, r.pickup_location, r.destination, r.travel_date, r.travel_time,
            driver.full_name as driver_name, passenger.full_name as passenger_name
     from trips t
     join bookings b on b.id = t.booking_id
     join rides r on r.id = b.ride_id
     join users driver on driver.id = r.driver_id
     join users passenger on passenger.id = b.passenger_id
     where r.driver_id = $1 or b.passenger_id = $1
     order by r.travel_date desc, r.travel_time desc`,
    [req.user.id]
  );
  res.json(result.rows);
});

app.patch('/api/trips/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['ride_booked', 'trip_started', 'in_progress', 'completed', 'payment_pending', 'payment_completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid trip status.' });
  }

  const result = await query('update trips set status = $1, updated_at = now() where id = $2 returning *', [
    status,
    req.params.id
  ]);
  res.json(result.rows[0]);
});

app.get('/api/vehicles', requireAuth, async (req, res) => {
  const result = await query('select * from vehicles where owner_id = $1 order by created_at desc', [req.user.id]);
  res.json(result.rows);
});

app.post('/api/vehicles', requireAuth, async (req, res) => {
  const { model, registrationNumber, seatingCapacity, fuelType = 'petrol' } = req.body;
  const result = await query(
    `insert into vehicles (organization_id, owner_id, model, registration_number, seating_capacity, fuel_type)
     values ($1, $2, $3, upper($4), $5, $6)
     returning *`,
    [req.user.organizationId, req.user.id, model, registrationNumber, seatingCapacity, fuelType]
  );
  res.status(201).json(result.rows[0]);
});

app.get('/api/wallet', requireAuth, async (req, res) => {
  const wallet = await query('select * from wallets where user_id = $1', [req.user.id]);
  const transactions = await query(
    'select * from wallet_transactions where user_id = $1 order by created_at desc limit 20',
    [req.user.id]
  );
  res.json({ wallet: wallet.rows[0], transactions: transactions.rows });
});

app.post('/api/wallet/recharge', requireAuth, async (req, res) => {
  const amount = Number(req.body.amount || 0);
  if (amount <= 0) {
    return res.status(400).json({ message: 'Recharge amount must be greater than zero.' });
  }

  const wallet = await query('update wallets set balance = balance + $1 where user_id = $2 returning *', [
    amount,
    req.user.id
  ]);
  await query(
    `insert into wallet_transactions (user_id, amount, transaction_type, payment_method, note)
     values ($1, $2, 'credit', 'wallet', 'Wallet recharge')`,
    [req.user.id, amount]
  );
  res.json(wallet.rows[0]);
});

app.post('/api/payments', requireAuth, async (req, res) => {
  const { bookingId, amount, method } = req.body;
  const payment = await query(
    `insert into payments (booking_id, payer_id, amount, payment_method, status)
     values ($1, $2, $3, $4, 'completed')
     returning *`,
    [bookingId, req.user.id, amount, method]
  );
  res.status(201).json(payment.rows[0]);
});

app.get('/api/history', requireAuth, async (req, res) => {
  const result = await query(
    `select r.pickup_location, r.destination, r.travel_date, r.travel_time, t.status,
            driver.full_name as driver_name, passenger.full_name as passenger_name, b.total_fare
     from trips t
     join bookings b on b.id = t.booking_id
     join rides r on r.id = b.ride_id
     join users driver on driver.id = r.driver_id
     join users passenger on passenger.id = b.passenger_id
     where (r.driver_id = $1 or b.passenger_id = $1) and t.status in ('completed', 'payment_completed')
     order by r.travel_date desc`,
    [req.user.id]
  );
  res.json(result.rows);
});

app.get('/api/reports', requireAuth, async (req, res) => {
  const result = await query(
    `select
       count(t.id)::int as total_trips,
       coalesce(sum(r.estimated_distance_km), 0)::numeric(10,2) as total_distance_km,
       coalesce(sum(r.estimated_fuel_liters), 0)::numeric(10,2) as fuel_consumption_liters,
       coalesce(avg(r.fare_per_seat / nullif(r.estimated_distance_km, 0)), 0)::numeric(10,2) as cost_per_km
     from trips t
     join bookings b on b.id = t.booking_id
     join rides r on r.id = b.ride_id
     where r.organization_id = $1`,
    [req.user.organizationId]
  );
  res.json(result.rows[0]);
});

app.get('/api/admin/summary', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const result = await query(
    `select
       (select count(*) from users where organization_id = $1)::int as employees,
       (select count(*) from vehicles where organization_id = $1)::int as vehicles,
       (select count(*) from rides where organization_id = $1)::int as rides,
       (select count(*) from trips t join bookings b on b.id = t.booking_id join rides r on r.id = b.ride_id where r.organization_id = $1)::int as trips`,
    [req.user.organizationId]
  );
  res.json(result.rows[0]);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Server error.', detail: process.env.NODE_ENV === 'development' ? error.message : undefined });
});

app.listen(port, () => {
  console.log(`CommuteFlow running at http://127.0.0.1:${port}`);
});
