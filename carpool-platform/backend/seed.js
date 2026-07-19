/**
 * COMMUTE — Professional Demo Seed
 * Covers every section: Dashboard · Find Ride · My Trips · Trip Detail
 *                       Ride History · Wallet · Reports · Admin Dashboard
 *
 * Run: node seed.js  (from backend/)
 */
require('dotenv').config();
const mongoose    = require('mongoose');
const crypto      = require('crypto');
const connectDB   = require('./config/db');

const Organization = require('./models/Organization');
const User         = require('./models/User');
const Vehicle      = require('./models/Vehicle');
const Ride         = require('./models/Ride');
const Trip         = require('./models/Trip');
const Transaction  = require('./models/Transaction');
const Message      = require('./models/Message');
const { buildRoute } = require('./utils/geo');

// ─── tiny helpers ────────────────────────────────────────────────
const rng    = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick   = a => a[rng(0, a.length - 1)];
const pickN  = (a, n) => [...a].sort(() => .5 - Math.random()).slice(0, Math.min(n, a.length));
const ref    = () => 'rzp_test_' + crypto.randomBytes(8).toString('hex');
const PLAIN_PASSWORD = 'password123';

function dateAt(daysOffset, hour, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, min, 0, 0);
  return d;
}

// ─── Bangalore locations ─────────────────────────────────────────
const OFFICE = { address: 'Bagmane Tech Park, CV Raman Nagar, Bangalore', lat: 12.9716, lng: 77.6490 };

const HOMES = [
  { address: 'Koramangala 5th Block, Bangalore',    lat: 12.9352, lng: 77.6245 },
  { address: 'HSR Layout Sector 2, Bangalore',       lat: 12.9116, lng: 77.6389 },
  { address: 'Indiranagar 100ft Road, Bangalore',    lat: 12.9784, lng: 77.6408 },
  { address: 'Whitefield Main Road, Bangalore',      lat: 12.9698, lng: 77.7499 },
  { address: 'Electronic City Phase 1, Bangalore',   lat: 12.8399, lng: 77.6770 },
  { address: 'Marathahalli Bridge, Bangalore',       lat: 12.9591, lng: 77.6974 },
  { address: 'JP Nagar 6th Phase, Bangalore',        lat: 12.8905, lng: 77.5850 },
  { address: 'Bannerghatta Road, Bangalore',         lat: 12.8831, lng: 77.5993 },
  { address: 'Hebbal Ring Road, Bangalore',          lat: 13.0353, lng: 77.5920 },
  { address: 'Yeshwanthpur, Bangalore',              lat: 13.0218, lng: 77.5510 },
  { address: 'Malleshwaram 18th Cross, Bangalore',   lat: 13.0035, lng: 77.5650 },
  { address: 'Jayanagar 4th Block, Bangalore',       lat: 12.9250, lng: 77.5938 },
  { address: 'BTM Layout 2nd Stage, Bangalore',      lat: 12.9165, lng: 77.6101 },
  { address: 'Bellandur, Bangalore',                 lat: 12.9257, lng: 77.6766 },
];

// ─── Chat message pairs ───────────────────────────────────────────
const CHATS = [
  ['On my way! Reaching pickup in 8 mins 🚗', 'Great, waiting near the gate!'],
  ['Just crossed Silk Board, 10 mins away', 'Okay no rush, I am here'],
  ['Running 3 mins late, signal is bad', 'No worries, take your time 👍'],
  ['Reached your pickup point!', 'Coming down right now!'],
  ['Good morning everyone 🌅', 'Morning! Ready for another week'],
  ['AC on or off? It is a bit cold today', 'AC off please, agreed!'],
  ['Taking ORR today, less traffic', 'Good call, thanks Rahul'],
  ['Office parking B2 is free today', 'Perfect, dropping there works'],
  ['5 mins to office, smooth ride today!', 'Thanks for the great drive 😊'],
  ['Anyone want to stop for chai?', 'Yes please! The usual spot?'],
  ['Reached! Have a great day everyone 🙌', 'You too! Same time tomorrow?'],
  ['Slight delay at Marathahalli signal', 'Okay noted, will wait'],
];

// ════════════════════════════════════════════════════════════════
async function run() {
  await connectDB();
  console.log('\n🌱  Professional Demo Seed — TechNova Solutions\n');

  // ── wipe previous demo data ──────────────────────────────────
  console.log('🗑️   Clearing old demo data...');
  const old = await Organization.findOne({ code: 'TNOVA01' });
  if (old) {
    const uids = (await User.find({ organization: old._id }).select('_id')).map(u => u._id);
    await Promise.all([
      Ride.deleteMany({ organization: old._id }),
      Trip.deleteMany({ organization: old._id }),
      Transaction.deleteMany({ user: { $in: uids } }),
      Message.deleteMany({}),
      Vehicle.deleteMany({ owner: { $in: uids } }),
      User.deleteMany({ organization: old._id }),
      Organization.deleteOne({ _id: old._id }),
    ]);
  }

  // ── organisation ─────────────────────────────────────────────
  console.log('🏢  Organisation...');
  const org = await Organization.create({
    name: 'TechNova Solutions',
    domain: 'technova.in',
    code: 'TNOVA01',
    fuelCostPerLitre: 103.5,
    avgMileageKmpl: 15,
    costPerKm: 8.5,
  });

  // ── admin ─────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Priya Sharma', email: 'admin@technova.in', password: PLAIN_PASSWORD,
    phone: '9900000001', role: 'admin', organization: org._id,
    avatarColor: '#1FAE86', walletBalance: 2500,
    savedPlaces: [{ label: 'Office', ...OFFICE }, { label: 'Home', ...HOMES[0] }],
  });

  // ── drivers (8) ──────────────────────────────────────────────
  console.log('🚗  Drivers + vehicles...');
  const DRIVER_DEF = [
    { name:'Rahul Verma',   email:'rahul@technova.in',   phone:'9900000010', color:'#E85D50', hi:0,  vm:'Maruti Swift Dzire',    vr:'KA01AB1001', vc:4, vcol:'White',  rat:4.8, rc:45 },
    { name:'Kavya Menon',   email:'kavya@technova.in',   phone:'9900000011', color:'#5B8DEF', hi:1,  vm:'Hyundai Creta',         vr:'KA02CD2002', vc:5, vcol:'Silver', rat:4.9, rc:62 },
    { name:'Aditya Rao',    email:'aditya@technova.in',  phone:'9900000012', color:'#F5A623', hi:2,  vm:'Tata Nexon EV',         vr:'KA03EF3003', vc:4, vcol:'Blue',   rat:4.7, rc:38 },
    { name:'Sneha Pillai',  email:'sneha@technova.in',   phone:'9900000013', color:'#9B59B6', hi:3,  vm:'Honda City',            vr:'KA04GH4004', vc:4, vcol:'Red',    rat:4.6, rc:29 },
    { name:'Vikram Nair',   email:'vikram@technova.in',  phone:'9900000014', color:'#1FAE86', hi:4,  vm:'Kia Seltos',            vr:'KA05IJ5005', vc:5, vcol:'Black',  rat:4.8, rc:53 },
    { name:'Ananya Das',    email:'ananya@technova.in',  phone:'9900000015', color:'#E67E22', hi:5,  vm:'Mahindra XUV 3XO',     vr:'KA06KL6006', vc:6, vcol:'Brown',  rat:4.5, rc:21 },
    { name:'Rohit Joshi',   email:'rohit@technova.in',   phone:'9900000016', color:'#27AE60', hi:6,  vm:'Toyota Innova Crysta',  vr:'KA07MN7007', vc:7, vcol:'White',  rat:4.9, rc:71 },
    { name:'Meghna Kapoor', email:'meghna@technova.in',  phone:'9900000017', color:'#E91E63', hi:7,  vm:'MG Hector',             vr:'KA08OP8008', vc:5, vcol:'Grey',   rat:4.7, rc:34 },
  ];

  const drivers = [];
  for (const d of DRIVER_DEF) {
    const user = await User.create({
      name:d.name, email:d.email, password:PLAIN_PASSWORD, phone:d.phone,
      organization:org._id, avatarColor:d.color,
      walletBalance: rng(600,3000),
      ratingAvg:d.rat, ratingCount:d.rc,
      savedPlaces:[{ label:'Home', ...HOMES[d.hi] },{ label:'Office', ...OFFICE }],
    });
    const vehicle = await Vehicle.create({
      owner:user._id, model:d.vm, registrationNumber:d.vr,
      seatingCapacity:d.vc, color:d.vcol,
    });
    drivers.push({ user, vehicle, home: HOMES[d.hi] });
  }

  // ── passengers (6) ───────────────────────────────────────────
  console.log('👥  Passengers...');
  const PASS_DEF = [
    { name:'Meera Nair',     email:'meera@technova.in',    phone:'9900000020', color:'#FF6B6B', hi:8  },
    { name:'Arjun Patel',    email:'arjun@technova.in',    phone:'9900000021', color:'#4ECDC4', hi:9  },
    { name:'Divya Krishnan', email:'divya@technova.in',    phone:'9900000022', color:'#45B7D1', hi:10 },
    { name:'Sanjay Kumar',   email:'sanjay@technova.in',   phone:'9900000023', color:'#96CEB4', hi:11 },
    { name:'Lakshmi Iyer',   email:'lakshmi@technova.in',  phone:'9900000024', color:'#FFD93D', hi:12 },
    { name:'Karthik Reddy',  email:'karthik@technova.in',  phone:'9900000025', color:'#DDA0DD', hi:13 },
  ];

  const passengers = [];
  for (const p of PASS_DEF) {
    const user = await User.create({
      name:p.name, email:p.email, password:PLAIN_PASSWORD, phone:p.phone,
      organization:org._id, avatarColor:p.color,
      walletBalance: rng(300,1800),
      savedPlaces:[{ label:'Home', ...HOMES[p.hi] },{ label:'Office', ...OFFICE }],
    });
    passengers.push(user);
  }

  const allUsers = [admin, ...drivers.map(d=>d.user), ...passengers];

  // ── initial wallet recharges for everyone ─────────────────────
  console.log('💳  Wallet recharges...');
  for (const u of allUsers) {
    for (let i = 0; i < rng(4,8); i++) {
      const amt = pick([200,300,500,750,1000,1500,2000]);
      await Transaction.create({
        user:u._id, type:'recharge', amount:amt,
        method:pick(['upi','card','upi','card']),
        status:'success', gatewayRef:ref(),
        note:`Wallet top-up ₹${amt}`,
        createdAt: dateAt(-rng(5,85), rng(9,20)),
      });
    }
  }

  // ─── core helper: build one completed ride+trip ───────────────
  async function makeCompleted(driver, daysAgo, hour, passList) {
    const depDate    = dateAt(-daysAgo, hour, pick([0,15,30,45]));
    const completedAt= new Date(depDate.getTime() + rng(25,60)*60000);
    const route      = buildRoute(driver.home, OFFICE);
    const fare       = Math.round(route.distanceKm * org.costPerKm * (0.8 + Math.random()*0.4));
    const seats      = Math.min(passList.length, driver.vehicle.seatingCapacity - 1);
    const booked     = passList.slice(0, seats);
    const methods    = ['wallet','upi','cash','card','wallet','upi','cash'];

    // Ride — use insertOne to bypass Mongoose validators (past date is intentional)
    const rideDoc = await Ride.collection.insertOne({
      driver: driver.user._id, vehicle: driver.vehicle._id, organization: org._id,
      pickup: driver.home, destination: OFFICE,
      distanceKm: route.distanceKm, durationMin: route.durationMin,
      routePolyline: route.polyline, departureAt: depDate,
      availableSeats: 0, totalSeats: driver.vehicle.seatingCapacity,
      farePerSeat: fare, isRecurring: false, status: 'completed',
      createdAt: depDate, updatedAt: completedAt,
    });
    const rideId = rideDoc.insertedId;

    const tripPassengers = booked.map(p => ({
      _id: new mongoose.Types.ObjectId(),
      user: p._id, seatsBooked: 1, fare,
      paymentStatus: 'completed',
      paymentMethod: pick(methods), boarded: true,
    }));

    const trackHistory = route.polyline.map((pt, i) => ({
      lat:pt.lat, lng:pt.lng,
      at: new Date(depDate.getTime() + (i/route.polyline.length)*route.durationMin*60000),
    }));

    const tripDoc = await Trip.collection.insertOne({
      ride: rideId, driver: driver.user._id, vehicle: driver.vehicle._id,
      organization: org._id, passengers: tripPassengers,
      pickup: driver.home, destination: OFFICE,
      distanceKm: route.distanceKm, departureAt: depDate,
      status: 'completed',
      currentLocation: { ...route.polyline[route.polyline.length-1], updatedAt: completedAt },
      trackHistory, liveShares: [],
      startedAt: depDate, completedAt,
      createdAt: depDate, updatedAt: completedAt,
    });
    const tripId = tripDoc.insertedId;

    // Transactions
    for (const tp of tripPassengers) {
      const pu = booked.find(p => String(p._id) === String(tp.user));
      if (!pu) continue;
      await Transaction.collection.insertOne({
        user: pu._id, trip: tripId, type:'ride_payment',
        amount: fare, method: tp.paymentMethod, status:'success',
        gatewayRef: tp.paymentMethod!=='cash' ? ref() : null,
        note:`Ride to Bagmane Tech Park`,
        createdAt: completedAt, updatedAt: completedAt,
      });
    }
    await Transaction.collection.insertOne({
      user: driver.user._id, trip: tripId, type:'ride_earning',
      amount: fare * booked.length, method:'system', status:'success',
      note:`Earning: ${booked.length} passenger(s)`,
      createdAt: completedAt, updatedAt: completedAt,
    });

    // Chat messages
    const all = [driver.user, ...booked];
    const pair = pick(CHATS);
    if (all.length >= 2) {
      await Message.collection.insertMany([
        { trip:tripId, sender:all[0]._id, text:pair[0], createdAt:new Date(depDate.getTime()+2*60000), updatedAt:new Date(depDate.getTime()+2*60000) },
        { trip:tripId, sender:all[1]._id, text:pair[1], createdAt:new Date(depDate.getTime()+4*60000), updatedAt:new Date(depDate.getTime()+4*60000) },
      ]);
      if (all.length > 2) {
        await Message.collection.insertOne({
          trip:tripId, sender:pick(all)._id,
          text: pick(['Safe ride! 🙌','Thanks for the smooth drive!','See you at office 👋','Great driving as always!']),
          createdAt:new Date(completedAt.getTime()-90000), updatedAt:new Date(completedAt.getTime()-90000),
        });
      }
    }
    return { rideId, tripId };
  }

  // ─── helper: upcoming booked ride+trip ───────────────────────
  async function makeBooked(driver, daysFromNow, hour, passList) {
    const depDate = dateAt(daysFromNow, hour, pick([0,15,30]));
    const route   = buildRoute(driver.home, OFFICE);
    const fare    = Math.round(route.distanceKm * org.costPerKm * (0.9+Math.random()*0.2));
    const seats   = Math.min(passList.length, driver.vehicle.seatingCapacity - 1);
    const booked  = passList.slice(0, seats);
    const avail   = driver.vehicle.seatingCapacity - 1 - booked.length;

    const ride = await Ride.create({
      driver:driver.user._id, vehicle:driver.vehicle._id, organization:org._id,
      pickup:driver.home, destination:OFFICE,
      distanceKm:route.distanceKm, durationMin:route.durationMin,
      routePolyline:route.polyline, departureAt:depDate,
      availableSeats: Math.max(avail,0), totalSeats:driver.vehicle.seatingCapacity,
      farePerSeat:fare, status: avail<=0?'full':'active',
    });

    if (booked.length === 0) return;

    const trip = await Trip.create({
      ride:ride._id, driver:driver.user._id, vehicle:driver.vehicle._id,
      organization:org._id,
      passengers: booked.map(p=>({ user:p._id, seatsBooked:1, fare, paymentStatus:'pending', paymentMethod:null, boarded:false })),
      pickup:driver.home, destination:OFFICE,
      distanceKm:route.distanceKm, departureAt:depDate,
      status:'booked',
    });
  }

  // ─── helper: open active ride (no passengers yet) ─────────────
  async function makeActive(driver, daysFromNow, hour) {
    const depDate = dateAt(daysFromNow, hour, pick([0,15,30]));
    const route   = buildRoute(driver.home, OFFICE);
    const fare    = Math.round(route.distanceKm * org.costPerKm);
    await Ride.create({
      driver:driver.user._id, vehicle:driver.vehicle._id, organization:org._id,
      pickup:driver.home, destination:OFFICE,
      distanceKm:route.distanceKm, durationMin:route.durationMin,
      routePolyline:route.polyline, departureAt:depDate,
      availableSeats:driver.vehicle.seatingCapacity-1,
      totalSeats:driver.vehicle.seatingCapacity,
      farePerSeat:fare, status:'active',
    });
  }

  // ════════════════════════════════════════════════════════════════
  // PAST 90 DAYS — completed trips (bulk of the 200+)
  // Each weekday: every driver does 1 morning trip, half do evening
  // ════════════════════════════════════════════════════════════════
  console.log('📅  90-day history (completed trips)...');
  let done = 0;

  for (let day = 90; day >= 2; day--) {
    const d = new Date(); d.setDate(d.getDate() - day);
    if (d.getDay()===0 || d.getDay()===6) continue; // skip weekends

    // morning — all 8 drivers
    for (const driver of drivers) {
      const hour = pick([7,8,8,9]);
      const numP = rng(1, Math.min(3, driver.vehicle.seatingCapacity-1));
      await makeCompleted(driver, day, hour, pickN(passengers, numP));
      done++;
    }

    // evening — random 3-5 drivers
    for (const driver of pickN(drivers, rng(3,5))) {
      const hour = pick([17,18,18,19]);
      const numP = rng(1, Math.min(2, driver.vehicle.seatingCapacity-1));
      await makeCompleted(driver, day, hour, pickN(passengers, numP));
      done++;
    }
  }
  console.log(`   ✅  ${done} completed trips`);

  // ════════════════════════════════════════════════════════════════
  // YESTERDAY — completed (shows in ride history immediately)
  // ════════════════════════════════════════════════════════════════
  console.log('📅  Yesterday...');
  for (const driver of drivers) {
    await makeCompleted(driver, 1, pick([8,9]), pickN(passengers, rng(1,3)));
  }

  // ════════════════════════════════════════════════════════════════
  // TODAY
  // ════════════════════════════════════════════════════════════════
  console.log('📅  Today...');

  // 1. One IN_PROGRESS trip right now (Rahul is driving)
  {
    const driver  = drivers[0]; // Rahul
    const route   = buildRoute(driver.home, OFFICE);
    const fare    = Math.round(route.distanceKm * org.costPerKm);
    const dep     = dateAt(0, 9, 0);
    const midPt   = route.polyline[Math.floor(route.polyline.length/2)];
    const pax     = passengers.slice(0,2);

    const rideDoc = await Ride.collection.insertOne({
      driver:driver.user._id, vehicle:driver.vehicle._id, organization:org._id,
      pickup:driver.home, destination:OFFICE,
      distanceKm:route.distanceKm, durationMin:route.durationMin,
      routePolyline:route.polyline, departureAt:dep,
      availableSeats:0, totalSeats:driver.vehicle.seatingCapacity,
      farePerSeat:fare, isRecurring:false, status:'completed',
      createdAt:dep, updatedAt:new Date(),
    });

    const tripDoc = await Trip.collection.insertOne({
      ride:rideDoc.insertedId, driver:driver.user._id, vehicle:driver.vehicle._id,
      organization:org._id,
      passengers: pax.map(p=>({ _id:new mongoose.Types.ObjectId(), user:p._id, seatsBooked:1, fare, paymentStatus:'pending', paymentMethod:null, boarded:true })),
      pickup:driver.home, destination:OFFICE,
      distanceKm:route.distanceKm, departureAt:dep,
      status:'in_progress',
      currentLocation:{ lat:midPt.lat, lng:midPt.lng, updatedAt:new Date() },
      trackHistory: route.polyline.slice(0, Math.floor(route.polyline.length/2)+1).map((pt,i)=>({
        lat:pt.lat, lng:pt.lng, at:new Date(dep.getTime()+i*90000),
      })),
      liveShares:[], startedAt:new Date(Date.now()-12*60000),
      createdAt:dep, updatedAt:new Date(),
    });

    const tid = tripDoc.insertedId;
    await Message.collection.insertMany([
      { trip:tid, sender:driver.user._id, text:'On the way, smooth traffic today! 🚗', createdAt:new Date(Date.now()-10*60000), updatedAt:new Date() },
      { trip:tid, sender:pax[0]._id,      text:'Awesome, we are almost there 😄',      createdAt:new Date(Date.now()-7*60000),  updatedAt:new Date() },
      { trip:tid, sender:pax[1]._id,      text:'Best carpool partner ever Rahul 👏',   createdAt:new Date(Date.now()-4*60000),  updatedAt:new Date() },
      { trip:tid, sender:driver.user._id, text:'5 mins to office, parking at B2!',     createdAt:new Date(Date.now()-2*60000),  updatedAt:new Date() },
    ]);
    console.log('   ✅  In-progress trip (Rahul + 2 passengers, live now)');
  }

  // 2. Four BOOKED trips later today
  const todayBookedSlots = [
    { driver: drivers[1], hour:10, pass: passengers.slice(0,2) },
    { driver: drivers[2], hour:11, pass: passengers.slice(2,4) },
    { driver: drivers[4], hour:14, pass: passengers.slice(1,3) },
    { driver: drivers[6], hour:17, pass: passengers.slice(3,5) },
  ];
  for (const s of todayBookedSlots) await makeBooked(s.driver, 0, s.hour, s.pass);
  console.log('   ✅  4 booked trips for later today');

  // 3. Four OPEN active rides today (no passengers yet — shows in Find Ride)
  for (const driver of [drivers[3], drivers[5], drivers[7], drivers[0]]) {
    await makeActive(driver, 0, pick([10,11,13,15,17]));
  }
  console.log('   ✅  4 open rides (available to book today)');

  // ════════════════════════════════════════════════════════════════
  // NEXT 7 DAYS — upcoming rides (Find Ride + My Trips)
  // ════════════════════════════════════════════════════════════════
  console.log('📅  Next 7 days (upcoming)...');
  let upcoming = 0;
  for (let day = 1; day <= 7; day++) {
    const d = new Date(); d.setDate(d.getDate() + day);
    if (d.getDay()===0 || d.getDay()===6) continue;

    // morning — all drivers, some with passengers already booked
    for (let i=0; i<drivers.length; i++) {
      const driver = drivers[i];
      const hour   = pick([7,8,8,9]);
      const numP   = rng(0, Math.min(2, driver.vehicle.seatingCapacity-1));
      if (numP > 0) await makeBooked(driver, day, hour, pickN(passengers, numP));
      else          await makeActive(driver, day, hour);
      upcoming++;
    }

    // evening — half drivers
    for (const driver of pickN(drivers, 4)) {
      const numP = rng(0,2);
      if (numP > 0) await makeBooked(driver, day, pick([17,18,19]), pickN(passengers, numP));
      else          await makeActive(driver, day, pick([17,18,19]));
      upcoming++;
    }
  }
  console.log(`   ✅  ${upcoming} upcoming rides/trips`);

  // ════════════════════════════════════════════════════════════════
  // Recalculate wallet balances from actual transactions
  // ════════════════════════════════════════════════════════════════
  console.log('💰  Recalculating wallet balances...');
  for (const u of allUsers) {
    const txns = await Transaction.find({ user: u._id });
    let bal = txns.reduce((acc, t) => {
      if (t.type==='recharge' || t.type==='ride_earning') return acc + t.amount;
      if (t.type==='ride_payment' && t.method==='wallet')  return acc - t.amount;
      return acc;
    }, 0);
    await User.findByIdAndUpdate(u._id, { walletBalance: Math.max(0, Math.round(bal)) });
  }

  // ════════════════════════════════════════════════════════════════
  // Final counts
  // ════════════════════════════════════════════════════════════════
  const [rides, trips, txns, msgs, users] = await Promise.all([
    Ride.countDocuments({ organization: org._id }),
    Trip.countDocuments({ organization: org._id }),
    Transaction.countDocuments(),
    Message.countDocuments(),
    User.countDocuments({ organization: org._id }),
  ]);

  console.log('\n' + '═'.repeat(56));
  console.log('✅  SEED COMPLETE');
  console.log('═'.repeat(56));
  console.log(`   Users        : ${users}  (1 admin + 8 drivers + 6 passengers)`);
  console.log(`   Rides        : ${rides}`);
  console.log(`   Trips        : ${trips}`);
  console.log(`   Transactions : ${txns}`);
  console.log(`   Messages     : ${msgs}`);
  console.log('═'.repeat(56));
  console.log('\n   Password for all accounts: password123');
  console.log('   Org signup code          : TNOVA01\n');
  console.log('   ADMIN     → admin@technova.in');
  console.log('   DRIVERS   → rahul@technova.in   ← in-progress trip RIGHT NOW');
  console.log('             → kavya@technova.in');
  console.log('             → aditya@technova.in');
  console.log('             → sneha@technova.in');
  console.log('             → vikram@technova.in');
  console.log('             → ananya@technova.in');
  console.log('             → rohit@technova.in');
  console.log('             → meghna@technova.in');
  console.log('   PASSENGERS→ meera@technova.in');
  console.log('             → arjun@technova.in');
  console.log('             → divya@technova.in');
  console.log('             → sanjay@technova.in');
  console.log('             → lakshmi@technova.in');
  console.log('             → karthik@technova.in\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Seed failed:', err.message || err);
  process.exit(1);
});
