const express = require('express');
const Ride = require('../models/Ride');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');
const { buildRoute, distanceKm } = require('../utils/geo');
const { validateDepartureDate } = require('../utils/validate');
const { predictFare } = require('../ml/farePredictor');
const { scoreRides } = require('../ml/matchScore');

const router = express.Router();

// Helper function to validate booking date (today or within 1 year)
const validateDepartureDate = (dateStr) => {
  const departureDate = new Date(dateStr);
  const now = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  // Departure must be today or later
  if (departureDate < now) {
    return { valid: false, message: 'Departure date must be today or later' };
  }

  // Departure cannot exceed 1 year from today
  if (departureDate > maxDate) {
    return { valid: false, message: 'Departure date cannot exceed 1 year from today' };
  }

  return { valid: true };
};

// Helper function to validate coordinates
const validateCoordinates = (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
};

// Helper function to validate distance
const validateDistance = (km) => {
  const distance = Number(km);
  return distance > 0.5 && distance <= 5000;
};

// Helper function to validate fare
const validateFare = (fare) => {
  const fareNum = Number(fare);
  // Fare should be between 1 and 10000 per seat
  return fareNum > 0 && fareNum <= 10000 && Number.isFinite(fareNum);
};

// POST /api/rides/suggest-fare
router.post('/suggest-fare', protect, async (req, res) => {
  try {
    const { distanceKm: km, departureAt } = req.body;
    if (!km) return res.status(400).json({ message: 'distanceKm is required' });

    if (!validateDistance(km)) {
      return res.status(400).json({ message: 'Distance must be between 0.5 and 5000 km' });
    }

    const Organization = require('../models/Organization');
    const org = await Organization.findById(req.user.organization);
    const result = await predictFare(req.user.organization, km, departureAt, org?.costPerKm || 8);
    res.json(result);
  } catch (err) {
    console.error('[rides/suggest-fare]', err.message);
    res.status(500).json({ message: 'Fare prediction failed', error: err.message });
  }
});

// POST /api/rides/route-preview
router.post('/route-preview', protect, async (req, res) => {
  try {
    const { pickup, destination } = req.body;
    if (!pickup?.lat || !destination?.lat) {
      return res.status(400).json({ message: 'pickup and destination with lat/lng are required' });
    }
<<<<<<< Updated upstream

    if (!validateCoordinates(pickup.lat, pickup.lng)) {
      return res.status(400).json({ message: 'Invalid pickup coordinates' });
    }

    if (!validateCoordinates(destination.lat, destination.lng)) {
      return res.status(400).json({ message: 'Invalid destination coordinates' });
    }

    const route = buildRoute(pickup, destination);
    res.json({ route });
  } catch (err) {
    console.error('[rides/route-preview]', err.message);
    res.status(500).json({ message: 'Route preview failed', error: err.message });
=======
    const route = await buildRoute(pickup, destination);
    res.json({ route });
  } catch (err) {
    res.status(500).json({ message: 'Route calculation failed', error: err.message });
>>>>>>> Stashed changes
  }
});

// POST /api/rides  -> Offer a Ride (publish)
router.post('/', protect, async (req, res) => {
  try {
    const { vehicleId, pickup, destination, departureAt, availableSeats, farePerSeat, isRecurring } = req.body;
    if (!vehicleId || !pickup || !destination || !departureAt || !availableSeats || !farePerSeat) {
      return res.status(400).json({ message: 'Missing required fields to publish a ride' });
    }

    // Validate pickup coordinates
    if (!validateCoordinates(pickup.lat, pickup.lng)) {
      return res.status(400).json({ message: 'Invalid pickup coordinates' });
    }

    // Validate destination coordinates
    if (!validateCoordinates(destination.lat, destination.lng)) {
      return res.status(400).json({ message: 'Invalid destination coordinates' });
    }

    // Validate departure date
    const dateValidation = validateDepartureDate(departureAt);
    if (!dateValidation.valid) {
      return res.status(400).json({ message: dateValidation.message });
    }

    // Validate fare per seat
    if (!validateFare(farePerSeat)) {
      return res.status(400).json({ message: 'Fare per seat must be between 1 and 10000' });
    }

    // Validate available seats
    const seats = Number(availableSeats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 8) {
      return res.status(400).json({ message: 'Available seats must be between 1 and 8' });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id, isActive: true });
    if (!vehicle) {
      return res.status(400).json({ message: 'Please register a vehicle before publishing a ride' });
    }
    if (seats > vehicle.seatingCapacity) {
      return res.status(400).json({ message: `Vehicle only supports up to ${vehicle.seatingCapacity} seats` });
    }

    const dateCheck = validateDepartureDate(departureAt);
    if (!dateCheck.ok) {
      return res.status(400).json({ message: dateCheck.message });
    }

    const route = await buildRoute(pickup, destination);

    const ride = await Ride.create({
      driver: req.user._id,
      vehicle: vehicle._id,
      organization: req.user.organization,
      pickup,
      destination,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      routePolyline: route.polyline,
      departureAt,
      availableSeats: seats,
      totalSeats: seats,
      farePerSeat,
      isRecurring: !!isRecurring,
    });

    res.status(201).json({ ride });
  } catch (err) {
    console.error('[rides/create]', err.message);
    res.status(500).json({ message: 'Failed to publish ride', error: err.message });
  }
});

// GET /api/rides/search  -> Find a Ride
// query: pickupLat, pickupLng, destLat, destLng, date, seats
router.get('/search', protect, async (req, res) => {
  try {
    const { pickupLat, pickupLng, destLat, destLng, date, seats } = req.query;
    const seatsNeeded = Number(seats) || 1;

    // Validate seats
    if (seatsNeeded < 1 || seatsNeeded > 8) {
      return res.status(400).json({ message: 'Seats must be between 1 and 8' });
    }

    const filter = {
      organization: req.user.organization,
      status: 'active',
      driver: { $ne: req.user._id },
      availableSeats: { $gte: seatsNeeded },
    };

    if (date) {
      const dateCheck = validateDepartureDate(date);
      if (!dateCheck.ok) {
        return res.status(400).json({ message: dateCheck.message });
      }
      const day = new Date(date);
      const start = new Date(day.setHours(0, 0, 0, 0));
      const end = new Date(day.setHours(23, 59, 59, 999));
      filter.departureAt = { $gte: start, $lte: end };
    } else {
      filter.departureAt = { $gte: new Date() };
    }

    let rides = await Ride.find(filter)
      .populate('driver', 'name avatarColor ratingAvg phone')
      .populate('vehicle', 'model registrationNumber color seatingCapacity')
      .sort('departureAt')
      .limit(50)
      .lean();

    // rank by proximity to requested pickup/destination when coordinates provided
    if (pickupLat && pickupLng) {
      if (!validateCoordinates(pickupLat, pickupLng)) {
        return res.status(400).json({ message: 'Invalid pickup coordinates' });
      }

      const target = { lat: Number(pickupLat), lng: Number(pickupLng) };
      rides = rides
        .map((r) => ({ ...r, pickupDistanceKm: Math.round(distanceKm(target, r.pickup) * 10) / 10 }))
        .filter((r) => r.pickupDistanceKm <= 15) // within 15km of requested pickup
        .sort((a, b) => a.pickupDistanceKm - b.pickupDistanceKm);
    }

    if (destLat && destLng) {
      if (!validateCoordinates(destLat, destLng)) {
        return res.status(400).json({ message: 'Invalid destination coordinates' });
      }

      const target = { lat: Number(destLat), lng: Number(destLng) };
      rides = rides.map((r) => ({ ...r, destDistanceKm: Math.round(distanceKm(target, r.destination) * 10) / 10 }));
    }

    // collaborative signal: drivers this rider has successfully ridden with before
    const pastTrips = await Trip.find({ 'passengers.user': req.user._id, status: 'completed' }).select('driver').lean();
    const pastDriverIds = new Set(pastTrips.map((t) => String(t.driver)));

    const requestedTime = date ? `${date}` : undefined;
    rides = scoreRides(rides, { requestedTime, pastDriverIds });

    res.json({ rides });
  } catch (err) {
    console.error('[rides/search]', err.message);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

// GET /api/rides/mine  -> rides the current user is offering (driver)
router.get('/mine', protect, async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user._id }).populate('vehicle').sort('-createdAt');
    res.json({ rides });
  } catch (err) {
    console.error('[rides/mine]', err.message);
    res.status(500).json({ message: 'Failed to fetch rides', error: err.message });
  }
});

// GET /api/rides/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name avatarColor ratingAvg phone')
      .populate('vehicle');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json({ ride });
  } catch (err) {
    console.error('[rides/get]', err.message);
    res.status(500).json({ message: 'Failed to fetch ride', error: err.message });
  }
});

// POST /api/rides/:id/book  -> books seats, creates/updates the Trip
router.post('/:id/book', protect, async (req, res) => {
  try {
    const { seats } = req.body;
    const seatsRequested = Number(seats) || 1;

    // Validate seats
    if (!Number.isInteger(seatsRequested) || seatsRequested < 1 || seatsRequested > 8) {
      return res.status(400).json({ message: 'Seats must be a number between 1 and 8' });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride || ride.status !== 'active') {
      return res.status(400).json({ message: 'This ride is no longer available' });
    }
    if (String(ride.driver) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot book your own ride' });
    }
    if (ride.availableSeats < seatsRequested) {
      return res.status(400).json({ message: 'Not enough available seats' });
    }

    ride.availableSeats -= seatsRequested;
    if (ride.availableSeats === 0) ride.status = 'full';
    await ride.save();

    let trip = await Trip.findOne({ ride: ride._id, status: { $in: ['booked', 'started', 'in_progress'] } });
    const fare = seatsRequested * ride.farePerSeat;

    if (!trip) {
      trip = await Trip.create({
        ride: ride._id,
        driver: ride.driver,
        vehicle: ride.vehicle,
        organization: ride.organization,
        pickup: ride.pickup,
        destination: ride.destination,
        distanceKm: ride.distanceKm,
        departureAt: ride.departureAt,
        passengers: [{ user: req.user._id, seatsBooked: seatsRequested, fare }],
      });
    } else {
      trip.passengers.push({ user: req.user._id, seatsBooked: seatsRequested, fare });
      await trip.save();
    }

    res.status(201).json({ trip });
  } catch (err) {
    console.error('[rides/book]', err.message);
    res.status(500).json({ message: 'Booking failed', error: err.message });
  }
});

// PUT /api/rides/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, driver: req.user._id });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    ride.status = 'cancelled';
    await ride.save();
    res.json({ ride });
  } catch (err) {
    console.error('[rides/cancel]', err.message);
    res.status(500).json({ message: 'Failed to cancel ride', error: err.message });
  }
});

module.exports = router;