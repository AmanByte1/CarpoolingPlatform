// Adds a large, realistic batch of data (~250 records) on top of the base
// `npm run seed` demo data, so Reports/Business Insights/Find-a-Ride have
// enough volume to look and behave like a real, actively-used platform.
//
// Run AFTER `npm run seed` (needs the ACME01 organization to already exist).
// Safe to re-run: it always adds a NEW batch rather than deleting old data,
// so running it twice just doubles your data (handy for stress-testing).
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Ride = require('./models/Ride');
const Trip = require('./models/Trip');
const Transaction = require('./models/Transaction');
const { buildSimulatedRoute } = require('./utils/geo');

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Rohan',
  'Ananya', 'Diya', 'Pari', 'Anika', 'Navya', 'Aadhya', 'Kiara', 'Myra', 'Sara', 'Riya',
  'Kabir', 'Aryan', 'Dhruv', 'Yash', 'Karan', 'Nikhil', 'Rahul', 'Varun', 'Siddharth', 'Aman',
  'Priya', 'Neha', 'Pooja', 'Kavya', 'Isha', 'Tanvi', 'Shreya', 'Meera', 'Simran', 'Anjali',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Shah', 'Mehta', 'Iyer', 'Rao', 'Nair', 'Gupta', 'Kumar',
  'Singh', 'Desai', 'Joshi', 'Reddy', 'Chopra', 'Kapoor', 'Malhotra', 'Bhatt', 'Trivedi', 'Pandey',
];
const CAR_MODELS = [
  'Maruti Swift', 'Hyundai i20', 'Tata Nexon', 'Honda City', 'Maruti Baleno', 'Kia Seltos',
  'Toyota Innova', 'Hyundai Creta', 'Maruti Dzire', 'Tata Altroz', 'Honda Amaze', 'MG Astor',
];
const COLORS = ['White', 'Silver', 'Red', 'Blue', 'Grey', 'Black'];
const PAYMENT_METHODS = ['cash', 'wallet', 'card', 'upi'];

const OFFICE = { address: 'GIFT City, Gandhinagar', lat: 23.161, lng: 72.685 };
const PLACES = [
  { address: 'Prahlad Nagar, Ahmedabad', lat: 23.008, lng: 72.506 },
  { address: 'Bopal, Ahmedabad', lat: 23.0322, lng: 72.4645 },
  { address: 'Maninagar, Ahmedabad', lat: 22.9963, lng: 72.6086 },
  { address: 'Chandkheda, Ahmedabad', lat: 23.1085, lng: 72.596 },
  { address: 'Vastrapur, Ahmedabad', lat: 23.0368, lng: 72.529 },
  { address: 'Nikol, Ahmedabad', lat: 23.148, lng: 72.642 },
  { address: 'Satellite, Ahmedabad', lat: 23.045, lng: 72.505 },
  { address: 'S.G. Highway, Ahmedabad', lat: 23.068, lng: 72.556 },
  { address: 'Naranpura, Ahmedabad', lat: 23.0563, lng: 72.5654 },
  { address: 'Thaltej, Ahmedabad', lat: 23.0505, lng: 72.5066 },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function run() {
  await connectDB();

  const org = await Organization.findOne({ code: 'ACME01' });
  if (!org) {
    console.error('❌ Organization ACME01 not found. Run "npm run seed" first, then run this script.');
    process.exit(1);
  }

  const NEW_EMPLOYEES = 45;
  const NEW_DRIVERS_WITH_VEHICLES = 25;
  const NEW_ACTIVE_RIDES = 40;
  const NEW_COMPLETED_TRIPS = 90;

  console.log(`\n👥 Creating ${NEW_EMPLOYEES} new employees...`);
  const newEmployees = [];
  const usedEmails = new Set();
  let suffix = Date.now() % 100000; // keep emails unique across repeated runs

  for (let i = 0; i < NEW_EMPLOYEES; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    let email;
    do {
      email = `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@acme.com`;
      suffix++;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const user = await User.create({
      name: `${first} ${last}`,
      email,
      password: 'Password@123',
      phone: String(randInt(6000000000, 9999999999)),
      organization: org._id,
      walletBalance: randInt(0, 1500),
      avatarColor: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      ratingAvg: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
      savedPlaces: [{ label: 'Office', ...OFFICE }, { label: 'Home', ...pick(PLACES) }],
    });
    newEmployees.push(user);
  }
  console.log(`✅ ${newEmployees.length} employees created`);

  console.log(`\n🚗 Registering vehicles for ${NEW_DRIVERS_WITH_VEHICLES} of them...`);
  const newDrivers = [];
  for (let i = 0; i < NEW_DRIVERS_WITH_VEHICLES; i++) {
    const owner = newEmployees[i];
    const vehicle = await Vehicle.create({
      owner: owner._id,
      model: pick(CAR_MODELS),
      registrationNumber: `GJ${randInt(1, 27)}${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}${randInt(1000, 9999)}`,
      seatingCapacity: randInt(3, 6),
      color: pick(COLORS),
    });
    newDrivers.push({ user: owner, vehicle });
  }
  console.log(`✅ ${newDrivers.length} vehicles registered`);

  // combine with existing drivers already in the org so trips look organic
  const existingDriverVehicles = await Vehicle.find({ isActive: true }).populate('owner');
  const allDrivers = [
    ...newDrivers,
    ...existingDriverVehicles
      .filter((v) => v.owner && String(v.owner.organization) === String(org._id))
      .map((v) => ({ user: v.owner, vehicle: v })),
  ];

  const allPotentialPassengers = [...newEmployees];
  const existingNonDrivers = await User.find({ organization: org._id });
  existingNonDrivers.forEach((u) => allPotentialPassengers.push(u));

  console.log(`\n🛣️  Creating ${NEW_ACTIVE_RIDES} upcoming active rides...`);
  let activeCreated = 0;
  for (let i = 0; i < NEW_ACTIVE_RIDES; i++) {
    const { user, vehicle } = pick(allDrivers);
    const toOffice = Math.random() > 0.5;
    const pickup = toOffice ? pick(PLACES) : OFFICE;
    const destination = toOffice ? OFFICE : pick(PLACES);
    const route = buildSimulatedRoute(pickup, destination);
    const departureAt = new Date(Date.now() + randInt(1, 14) * 24 * 3600 * 1000 + randInt(6, 20) * 3600 * 1000);
    const seats = randInt(1, Math.min(3, vehicle.seatingCapacity));

    await Ride.create({
      driver: user._id,
      vehicle: vehicle._id,
      organization: org._id,
      pickup,
      destination,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      routePolyline: route.polyline,
      departureAt,
      availableSeats: seats,
      totalSeats: seats,
      farePerSeat: Math.round(route.distanceKm * org.costPerKm * (0.9 + Math.random() * 0.3)),
      status: 'active',
    });
    activeCreated++;
  }
  console.log(`✅ ${activeCreated} active rides created`);

  console.log(`\n📜 Creating ${NEW_COMPLETED_TRIPS} historical completed trips...`);
  let completedCreated = 0;
  let transactionsCreated = 0;

  for (let i = 0; i < NEW_COMPLETED_TRIPS; i++) {
    const { user: driver, vehicle } = pick(allDrivers);
    const toOffice = Math.random() > 0.5;
    const pickup = toOffice ? pick(PLACES) : OFFICE;
    const destination = toOffice ? OFFICE : pick(PLACES);
    const route = buildSimulatedRoute(pickup, destination);

    const daysAgo = randInt(0, 60);
    const completedAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000 - randInt(0, 12) * 3600 * 1000);
    const startedAt = new Date(completedAt.getTime() - route.durationMin * 60 * 1000);

    // historical Ride record (fully booked, completed)
    const ride = await Ride.create({
      driver: driver._id,
      vehicle: vehicle._id,
      organization: org._id,
      pickup,
      destination,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      routePolyline: route.polyline,
      departureAt: startedAt,
      availableSeats: 0,
      totalSeats: randInt(2, 4),
      farePerSeat: Math.round(route.distanceKm * org.costPerKm * (0.9 + Math.random() * 0.3)),
      status: 'completed',
    });

    const passengerCount = Math.min(randInt(1, 3), Math.max(1, allPotentialPassengers.length - 1));
    const chosenPassengers = [];
    let attempts = 0;
    while (chosenPassengers.length < passengerCount && attempts < 200) {
      attempts++;
      const candidate = pick(allPotentialPassengers);
      if (String(candidate._id) !== String(driver._id) && !chosenPassengers.some((p) => String(p._id) === String(candidate._id))) {
        chosenPassengers.push(candidate);
      }
    }

    const passengers = chosenPassengers.map((p) => {
      const paid = Math.random() > 0.15; // ~85% of historical trips are paid
      return {
        user: p._id,
        seatsBooked: 1,
        fare: ride.farePerSeat,
        paymentStatus: paid ? 'completed' : 'pending',
        paymentMethod: paid ? pick(PAYMENT_METHODS) : null,
        boarded: true,
      };
    });

    const trip = await Trip.create({
      ride: ride._id,
      driver: driver._id,
      vehicle: vehicle._id,
      organization: org._id,
      pickup,
      destination,
      distanceKm: route.distanceKm,
      departureAt: startedAt,
      status: 'completed',
      startedAt,
      completedAt,
      currentLocation: { lat: destination.lat, lng: destination.lng, updatedAt: completedAt },
      trackHistory: route.polyline,
      passengers,
    });

    for (const p of passengers) {
      if (p.paymentStatus !== 'completed') continue;
      await Transaction.create({
        user: p.user, trip: trip._id, type: 'ride_payment', amount: p.fare,
        method: p.paymentMethod, status: 'success', createdAt: completedAt,
        note: `Payment for trip ${trip._id}`,
      });
      await Transaction.create({
        user: driver._id, trip: trip._id, type: 'ride_earning', amount: p.fare,
        method: p.paymentMethod, status: 'success', createdAt: completedAt,
        note: `Earning from trip ${trip._id}`,
      });
      transactionsCreated += 2;
    }

    completedCreated++;
  }
  console.log(`✅ ${completedCreated} completed trips created (${transactionsCreated} transactions)`);

  const total = newEmployees.length + newDrivers.length + activeCreated + completedCreated;
  console.log(`\n🎉 Done! Added ${total} new top-level records`);
  console.log(`   (${newEmployees.length} employees, ${newDrivers.length} vehicles, ${activeCreated} active rides, ${completedCreated} completed trips)`);
  console.log('   Log in as admin@acme.com / Admin@123 and check Business Insights / Reports to see it reflected.\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Bulk seed failed:', err);
  process.exit(1);
});
