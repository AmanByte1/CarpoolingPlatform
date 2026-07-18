create extension if not exists pgcrypto;

drop table if exists payments cascade;
drop table if exists wallet_transactions cascade;
drop table if exists wallets cascade;
drop table if exists trip_messages cascade;
drop table if exists live_locations cascade;
drop table if exists trips cascade;
drop table if exists bookings cascade;
drop table if exists rides cascade;
drop table if exists vehicles cascade;
drop table if exists saved_places cascade;
drop table if exists users cascade;
drop table if exists organization_settings cascade;
drop table if exists organizations cascade;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name varchar(160) not null unique,
  domain varchar(120),
  created_at timestamptz not null default now()
);

create table organization_settings (
  organization_id uuid primary key references organizations(id) on delete cascade,
  fuel_cost_per_liter numeric(10,2) not null default 105.00,
  base_cost_per_km numeric(10,2) not null default 6.50,
  allow_cash boolean not null default true,
  allow_card boolean not null default true,
  allow_upi boolean not null default true,
  allow_wallet boolean not null default true
);

create table users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name varchar(140) not null,
  email varchar(180) not null unique,
  password_hash text not null,
  phone varchar(30),
  role varchar(20) not null default 'employee' check (role in ('employee', 'admin')),
  created_at timestamptz not null default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid not null references users(id) on delete cascade,
  model varchar(120) not null,
  registration_number varchar(40) not null unique,
  seating_capacity integer not null check (seating_capacity > 0),
  fuel_type varchar(30) not null default 'petrol',
  created_at timestamptz not null default now()
);

create table saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label varchar(80) not null,
  address text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz not null default now()
);

create table rides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  driver_id uuid not null references users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  pickup_location varchar(220) not null,
  destination varchar(220) not null,
  travel_date date not null,
  travel_time time not null,
  available_seats integer not null check (available_seats >= 0),
  fare_per_seat numeric(10,2) not null check (fare_per_seat >= 0),
  recurring boolean not null default false,
  estimated_distance_km numeric(10,2) not null default 22.40,
  estimated_fuel_liters numeric(10,2) not null default 1.45,
  status varchar(30) not null default 'published' check (status in ('published', 'booked', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references rides(id) on delete cascade,
  passenger_id uuid not null references users(id) on delete cascade,
  seats_booked integer not null default 1 check (seats_booked > 0),
  total_fare numeric(10,2) not null check (total_fare >= 0),
  booking_status varchar(30) not null default 'confirmed' check (booking_status in ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  status varchar(30) not null default 'ride_booked' check (status in ('ride_booked', 'trip_started', 'in_progress', 'completed', 'payment_pending', 'payment_completed')),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table live_locations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  eta_minutes integer,
  status_note varchar(140),
  created_at timestamptz not null default now()
);

create table trip_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  balance numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(10,2) not null,
  transaction_type varchar(20) not null check (transaction_type in ('credit', 'debit')),
  payment_method varchar(30) not null check (payment_method in ('cash', 'card', 'upi', 'wallet')),
  note varchar(180),
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  payer_id uuid not null references users(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  payment_method varchar(30) not null check (payment_method in ('cash', 'card', 'upi', 'wallet')),
  status varchar(30) not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index rides_search_idx on rides (organization_id, travel_date, travel_time, status);
create index bookings_passenger_idx on bookings (passenger_id);
create index vehicles_owner_idx on vehicles (owner_id);
