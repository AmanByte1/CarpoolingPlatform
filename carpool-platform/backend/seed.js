require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Ride = require('./models/Ride');
const Trip = require('./models/Trip');
const Transaction = require('./models/Transaction');
const { buildRoute } = require('./utils/geo');

// Demo coordinates around Ahmedabad, Gujarat (major business hub)
const OFFICE = { address: 'GIFT City, Gandhinagar', lat: 23.1610, lng: 72.6850 };
const PLACES = [
  { address: 'Prahlad Nagar, Ahmedabad', lat: 23.0080, lng: 72.5060 },
  { address: 'Bopal, Ahmedabad', lat: 23.0322, lng: 72.4645 },
  { address: 'Maninagar, Ahmedabad', lat: 22.9963, lng: 72.6086 },
  { address: 'Chandkheda, Ahmedabad', lat: 23.1085, lng: 72.5960 },
  { address: 'Vastrapur, Ahmedabad', lat: 23.0368, lng: 72.5290 },
  { address: 'Nikol, Ahmedabad', lat: 23.1480, lng: 72.6420 },
  { address: 'Satellite, Ahmedabad', lat: 23.0450, lng: 72.5050 },
  { address: 'S.G. Highway, Ahmedabad', lat: 23.0680, lng: 72.5560 },
];

async function run() {
  await connectDB();

  console.log('🗑️  Clearing existing demo data...');
  await Promise.all([
    Organization.deleteMany({ code: 'ACME01' }),
    User.deleteMany({ email: /@acme.com$/ }),
    Vehicle.deleteMany({}),
    Ride.deleteMany({}),
    Trip.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  // ============================================
  // 1. CREATE ORGANIZATION
  // ============================================
  console.log('\\n📊 Creating organization...');
  const org = await Organization.create({
    name: 'Acme Technologies',
    domain: 'acme.com',
    code: 'ACME01',
    fuelCostPerLitre: 96.5,
    avgMileageKmpl: 16,
    costPerKm: 7.5,
  });
  console.log(`✅ Organization created: ${org.name}`);

  // ============================================
  // 2. CREATE ADMIN USER
  // ============================================
  console.log('\\n👨‍💼 Creating admin user...');
  const admin = await User.create({
    name: 'Ananya Shah',
    email: 'admin@acme.com',
    password: 'Admin@123', // Strong password
    phone: 9800000001,
    role: 'admin',
    organization: org._id,
    avatarColor: '#FF6B6B',
    walletBalance: 2000,
    ratingAvg: 5,
  });
  console.log(`✅ Admin user created: ${admin.name}`);

  // ============================================
  // 3. CREATE DRIVERS WITH VEHICLES
  // ============================================
  console.log('\\n🚗 Creating drivers and vehicles...');
  const driverData = [
    {
      name: 'Rohan Mehta',
      email: 'rohan@acme.com',
      phone: 9800000010,
      vehicle: 'Maruti Swift',
      regNumber: 'GJ01AB1001',
      color: 'White',
      avatar: '#4ECDC4',
    },
    {
      name: 'Kavya Iyer',
      email: 'kavya@acme.com',
      phone: 9800000011,
      vehicle: 'Hyundai i20',
      regNumber: 'GJ01AB1002',
      color: 'Red',
      avatar: '#45B7D1',
    },
    {
      name: 'Aditya Rao',
      email: 'aditya@acme.com',
      phone: 9800000012,
      vehicle: 'Tata Nexon',
      regNumber: 'GJ01AB1003',
      color: 'Blue',
      avatar: '#FFA07A',
    },
    {
      name: 'Isha Patel',
      email: 'isha@acme.com',
      phone: 9800000013,
      vehicle: 'Honda City',
      regNumber: 'GJ01AB1004',
      color: 'Silver',
      avatar: '#98D8C8',
    },
    {
      name: 'Vikram Singh',
      email: 'vikram@acme.com',
      phone: 9800000014,
      vehicle: 'Toyota Fortuner',
      regNumber: 'GJ01AB1005',
      color: 'Black',
      avatar: '#F7DC6F',
    },
  ];

  const drivers = [];
  for (const driverInfo of driverData) {
    const user = await User.create({
      name: driverInfo.name,
      email: driverInfo.email,
      password: 'Driver@123', // Strong password
      phone: driverInfo.phone,
      organization: org._id,
      avatarColor: driverInfo.avatar,
      walletBalance: Math.floor(Math.random() * 3000) + 1000, // 1000-4000
      ratingAvg: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      ratingCount: Math.floor(Math.random() * 50) + 10, // 10-60 ratings
      savedPlaces: [{ label: 'Office', ...OFFICE }],
    });

    const vehicle = await Vehicle.create({
      owner: user._id,
      model: driverInfo.vehicle,
      registrationNumber: driverInfo.regNumber,
      seatingCapacity: 4,
      color: driverInfo.color,
    });

    drivers.push({ user, vehicle });
    console.log(`  ✅ ${driverInfo.name} (${driverInfo.vehicle})`);
  }

  // ============================================
  // 4. CREATE PASSENGER USERS
  // ============================================
  console.log('\\n👥 Creating passenger users...');
  const passengerData = [
    { name: 'Meera Nair', email: 'meera@acme.com', phone: 9800000099, avatar: '#BB8FCE' },
    { name: 'Rahul Sharma', email: 'rahul@acme.com', phone: 9800000098, avatar: '#85C1E2' },
    { name: 'Priya Desai', email: 'priya@acme.com', phone: 9800000097, avatar: '#F8B88B' },
    { name: 'Amit Kumar', email: 'amit@acme.com', phone: 9800000096, avatar: '#A9DFBF' },
  ];

  const passengers = [];
  for (const passengerInfo of passengerData) {
    const user = await User.create({
      name: passengerInfo.name,
      email: passengerInfo.email,
      password: 'Passenger@123',
      phone: passengerInfo.phone,
      organization: org._id,
      avatarColor: passengerInfo.avatar,
      walletBalance: Math.floor(Math.random() * 2000) + 500, // 500-2500
      ratingAvg: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      ratingCount: Math.floor(Math.random() * 30) + 5, // 5-35 ratings
      savedPlaces: [
        { label: 'Office', ...OFFICE },
        { label: 'Home', ...PLACES[Math.floor(Math.random() * PLACES.length)] },
      ],
    });
    passengers.push(user);
    console.log(`  ✅ ${passengerInfo.name}`);
  }

  // ============================================
  // 5. CREATE ACTIVE RIDES (Today + Next 7 Days)
  // ============================================
  console.log('\\n📍 Creating active rides...');
  const now = new Date();
  const activeRides = [];

  for (let day = 0; day < 7; day++) {
    for (let i = 0; i < drivers.length; i++) {
      const departureTime = new Date(now);
      departureTime.setDate(departureTime.getDate() + day);
      departureTime.setHours(7 + (i % 4), Math.floor(Math.random() * 60), 0, 0); // 7AM-11AM

      const pickup = PLACES[i % PLACES.length];
      const destination = OFFICE;
      const route = buildRoute(pickup, destination);

      const ride = await Ride.create({
        driver: drivers[i].user._id,
        vehicle: drivers[i].vehicle._id,
        organization: org._id,
        pickup,
        destination,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        routePolyline: route.polyline,
        departureAt: departureTime,
        availableSeats: Math.floor(Math.random() * 3) + 1, // 1-3 available
        totalSeats: 4,
        farePerSeat: Math.round(route.distanceKm * org.costPerKm * 1.1), // With slight markup
        status: 'active',
      });
      activeRides.push(ride);
    }
  }
  console.log(`  ✅ Created ${activeRides.length} active rides`);

  // ============================================
  // 6. CREATE COMPLETED TRIPS WITH PASSENGERS & TRANSACTIONS
  // ============================================
  console.log('\\n✅ Creating completed trips...');
  const completedTrips = [];

  for (let tripIdx = 0; tripIdx < 15; tripIdx++) {
    const driverIdx = tripIdx % drivers.length;
    const passengerCount = Math.floor(Math.random() * 3) + 1; // 1-3 passengers
    const passenger1Idx = Math.floor(Math.random() * passengers.length);
    let passenger2Idx, passenger3Idx;

    const passengersInTrip = [passengers[passenger1Idx]];
    if (passengerCount > 1) {
      do {
        passenger2Idx = Math.floor(Math.random() * passengers.length);
      } while (passenger2Idx === passenger1Idx);
      passengersInTrip.push(passengers[passenger2Idx]);
    }
    if (passengerCount > 2) {
      do {
        passenger3Idx = Math.floor(Math.random() * passengers.length);
      } while (passenger3Idx === passenger1Idx || passenger3Idx === passenger2Idx);
      passengersInTrip.push(passengers[passenger3Idx]);
    }

    const completedTime = new Date();
    completedTime.setDate(completedTime.getDate() - Math.floor(Math.random() * 15));

    const pickup = PLACES[tripIdx % PLACES.length];
    const destination = OFFICE;
    const route = buildRoute(pickup, destination);

    // Create trip with passengers
    const passengerArray = passengersInTrip.map((passenger) => ({
      user: passenger._id,
      seatsBooked: 1,
      fare: Math.round(route.distanceKm * org.costPerKm),
      paymentStatus: 'completed',
      paymentMethod: ['cash', 'wallet', 'card'][Math.floor(Math.random() * 3)],
      boarded: true,
    }));

    const trip = await Trip.create({
      ride: activeRides[tripIdx % activeRides.length]._id,
      driver: drivers[driverIdx].user._id,
      vehicle: drivers[driverIdx].vehicle._id,
      organization: org._id,
      passengers: passengerArray,
      pickup,
      destination,
      distanceKm: route.distanceKm,
      departureAt: completedTime,
      status: 'completed',
      startedAt: completedTime,
      completedAt: new Date(completedTime.getTime() + route.durationMin * 60 * 1000),
      trackHistory: route.polyline,
    });
    completedTrips.push(trip);

    // Create transactions for each passenger payment
    for (const passenger of passengersInTrip) {
      const fare = Math.round(route.distanceKm * org.costPerKm);
      await Transaction.create({
        user: passenger._id,
        trip: trip._id,
        type: 'ride_payment',
        amount: fare,
        method: ['cash', 'wallet', 'card'][Math.floor(Math.random() * 3)],
        status: 'success',
        note: `Payment for trip to ${destination.address}`,
      });
    }

    // Create driver earning transaction
    const totalEarnings = passengersInTrip.reduce(
      (sum) => sum + Math.round(route.distanceKm * org.costPerKm),
      0
    );
    await Transaction.create({
      user: drivers[driverIdx].user._id,
      trip: trip._id,
      type: 'ride_earning',
      amount: totalEarnings,
      method: 'wallet',
      status: 'success',
      note: `Earnings from trip with ${passengerCount} passenger(s)`,
    });
  }
  console.log(`  ✅ Created ${completedTrips.length} completed trips`);

  // ============================================
  // 7. CREATE WALLET TRANSACTIONS
  // ============================================
  console.log('\\n💳 Creating wallet transactions...');
  for (let i = 0; i < 8; i++) {
    const userIdx = Math.floor(Math.random() * (passengers.length + drivers.length));
    const user = userIdx < passengers.length ? passengers[userIdx] : drivers[userIdx - passengers.length].user;

    await Transaction.create({
      user: user._id,
      type: 'recharge',
      amount: Math.floor(Math.random() * 4000) + 500, // 500-4500
      method: 'card',
      status: 'success',
      note: 'Wallet recharge',
    });
  }
  console.log('  ✅ Created wallet recharge transactions');

  // ============================================
  // 8. DISPLAY LOGIN CREDENTIALS
  // ============================================
  console.log('\\n' + '='.repeat(60));
  console.log('🎉 SEED DATA COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\\n📋 Demo Login Credentials:\n');
  console.log('Organization Code: ACME01\n');
  console.log('ADMIN:');
  console.log('  Email: admin@acme.com');
  console.log('  Password: Admin@123\n');

  console.log('DRIVERS:');
  driverData.forEach((driver, idx) => {
    console.log(`  Driver ${idx + 1}: ${driver.email} / Driver@123`);
  });

  console.log('\\nPASSENGERS:');
  passengerData.forEach((passenger) => {
    console.log(`  ${passenger.email} / Passenger@123`);
  });

  console.log('\\n📊 DEMO DATA SUMMARY:');
  console.log(`  ✅ Organization: 1`);
  console.log(`  ✅ Users: ${drivers.length} drivers + ${passengers.length} passengers + 1 admin`);
  console.log(`  ✅ Vehicles: ${drivers.length}`);
  console.log(`  ✅ Active Rides: ${activeRides.length} (7 days ahead)`);
  console.log(`  ✅ Completed Trips: ${completedTrips.length}`);
  console.log(`  ✅ Transactions: ${completedTrips.length * 3 + 8} (payments + earnings + recharge)`);
  console.log('\\n' + '='.repeat(60));

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
