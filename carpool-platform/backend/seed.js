require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Ride = require('./models/Ride');
const { buildRoute } = require('./utils/geo');

// Demo coordinates around Ahmedabad, Gujarat
const OFFICE = { address: 'GIFT City, Gandhinagar', lat: 23.1610, lng: 72.6850 };
const PLACES = [
  { address: 'Prahlad Nagar, Ahmedabad', lat: 23.0080, lng: 72.5060 },
  { address: 'Bopal, Ahmedabad', lat: 23.0322, lng: 72.4645 },
  { address: 'Maninagar, Ahmedabad', lat: 22.9963, lng: 72.6086 },
  { address: 'Chandkheda, Ahmedabad', lat: 23.1085, lng: 72.5960 },
  { address: 'Vastrapur, Ahmedabad', lat: 23.0368, lng: 72.5290 },
];

async function run() {
  await connectDB();

  console.log('Clearing existing demo data...');
  await Promise.all([
    Organization.deleteMany({ code: 'ACME01' }),
    User.deleteMany({ email: /@acme.com$/ }),
  ]);

  const org = await Organization.create({
    name: 'Acme Technologies',
    domain: 'acme.com',
    code: 'ACME01',
    fuelCostPerLitre: 96.5,
    avgMileageKmpl: 16,
    costPerKm: 7.5,
  });

  const admin = await User.create({
    name: 'Ananya Shah',
    email: 'admin@acme.com',
    password: 'password123',
    phone: '9800000001',
    role: 'admin',
    organization: org._id,
  });

  const driverNames = ['Rohan Mehta', 'Kavya Iyer', 'Aditya Rao', 'Isha Patel'];
  const drivers = [];
  for (let i = 0; i < driverNames.length; i++) {
    const user = await User.create({
      name: driverNames[i],
      email: `driver${i + 1}@acme.com`,
      password: 'password123',
      phone: `98000000${10 + i}`,
      organization: org._id,
      walletBalance: 500,
      savedPlaces: [{ label: 'Office', ...OFFICE }],
    });
    const vehicle = await Vehicle.create({
      owner: user._id,
      model: ['Maruti Swift', 'Hyundai i20', 'Tata Nexon', 'Honda City'][i],
      registrationNumber: `GJ01AB${1000 + i}`,
      seatingCapacity: 4,
      color: ['White', 'Red', 'Blue', 'Silver'][i],
    });
    drivers.push({ user, vehicle });
  }

  const passenger = await User.create({
    name: 'Meera Nair',
    email: 'meera@acme.com',
    password: 'password123',
    phone: '9800000099',
    organization: org._id,
    walletBalance: 750,
    savedPlaces: [{ label: 'Office', ...OFFICE }, { label: 'Home', ...PLACES[0] }],
  });

  console.log('Creating sample rides...');
  const now = Date.now();
  for (let i = 0; i < drivers.length; i++) {
    const pickup = PLACES[i % PLACES.length];
    const destination = OFFICE;
    const route = buildRoute(pickup, destination);
    await Ride.create({
      driver: drivers[i].user._id,
      vehicle: drivers[i].vehicle._id,
      organization: org._id,
      pickup,
      destination,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      routePolyline: route.polyline,
      departureAt: new Date(now + (i + 1) * 3600 * 1000),
      availableSeats: 3,
      totalSeats: 3,
      farePerSeat: Math.round(route.distanceKm * org.costPerKm),
    });
  }

  console.log('\nSeed complete! Demo login credentials:');
  console.log('  Org code: ACME01');
  console.log('  Admin    -> admin@acme.com / password123');
  console.log('  Driver 1 -> driver1@acme.com / password123');
  console.log('  Passenger -> meera@acme.com / password123');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
