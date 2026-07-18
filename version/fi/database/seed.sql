insert into organizations (id, name, domain)
values ('11111111-1111-1111-1111-111111111111', 'Demo Enterprise', 'company.com');

insert into organization_settings (organization_id)
values ('11111111-1111-1111-1111-111111111111');

insert into users (id, organization_id, full_name, email, password_hash, phone, role)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Aman Singh', 'employee@company.com', '$2a$10$XFEIFtgZOzyUhpLtJKw/We5N8rlcJPaoA8PHw7Y5YoTgrjH88bSr.', '+91 90000 00001', 'employee'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Priya Sharma', 'priya@company.com', '$2a$10$XFEIFtgZOzyUhpLtJKw/We5N8rlcJPaoA8PHw7Y5YoTgrjH88bSr.', '+91 90000 00002', 'employee'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@company.com', '$2a$10$XFEIFtgZOzyUhpLtJKw/We5N8rlcJPaoA8PHw7Y5YoTgrjH88bSr.', '+91 90000 00003', 'admin');

insert into wallets (user_id, balance)
values
  ('22222222-2222-2222-2222-222222222221', 1850.00),
  ('22222222-2222-2222-2222-222222222222', 920.00),
  ('22222222-2222-2222-2222-222222222223', 0.00);

insert into vehicles (id, organization_id, owner_id, model, registration_number, seating_capacity, fuel_type)
values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Hyundai Creta', 'KA 03 MN 5482', 4, 'petrol'),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Tata Nexon EV', 'KA 05 EV 2048', 4, 'electric');

insert into saved_places (user_id, label, address, latitude, longitude)
values
  ('22222222-2222-2222-2222-222222222221', 'Home', 'Indiranagar, Bengaluru', 12.9784, 77.6408),
  ('22222222-2222-2222-2222-222222222221', 'Office', 'Manyata Tech Park, Bengaluru', 13.0500, 77.6200);

insert into rides (id, organization_id, driver_id, vehicle_id, pickup_location, destination, travel_date, travel_time, available_seats, fare_per_seat, estimated_distance_km, estimated_fuel_liters, status)
values
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333331', 'Indiranagar', 'Manyata Tech Park', current_date, '08:15', 3, 85.00, 22.40, 1.45, 'published'),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333332', 'Koramangala', 'Whitefield', current_date, '08:35', 2, 110.00, 18.70, 0.00, 'published');

insert into bookings (id, ride_id, passenger_id, seats_booked, total_fare)
values ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222221', 1, 85.00);

insert into trips (booking_id, status, started_at)
values ('55555555-5555-5555-5555-555555555551', 'in_progress', now());

insert into wallet_transactions (user_id, amount, transaction_type, payment_method, note)
values ('22222222-2222-2222-2222-222222222221', 1850.00, 'credit', 'wallet', 'Opening demo wallet balance');
