const express = require('express');
const Trip = require('../models/Trip');
const Message = require('../models/Message');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

const isParticipant = (trip, userId) =>
  String(trip.driver) === String(userId) || trip.passengers.some((p) => String(p.user) === String(userId));

// GET /api/trips/mine -> all trips (as driver or passenger) - "My Trips"
router.get('/mine', protect, async (req, res) => {
  const trips = await Trip.find({
    $or: [{ driver: req.user._id }, { 'passengers.user': req.user._id }],
    status: { $in: ['booked', 'started', 'in_progress'] },
  })
    .populate('driver', 'name avatarColor ratingAvg phone')
    .populate('vehicle')
    .populate('passengers.user', 'name avatarColor phone')
    .sort('departureAt');
  res.json({ trips });
});

// GET /api/trips/history -> Ride History
router.get('/history', protect, async (req, res) => {
  const trips = await Trip.find({
    $or: [{ driver: req.user._id }, { 'passengers.user': req.user._id }],
    status: { $in: ['completed', 'cancelled'] },
  })
    .populate('driver', 'name avatarColor')
    .populate('vehicle')
    .populate('passengers.user', 'name avatarColor')
    .sort('-completedAt');
  res.json({ trips });
});

// GET /api/trips/:id
router.get('/:id', protect, async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate('driver', 'name avatarColor ratingAvg phone')
    .populate('vehicle')
    .populate('passengers.user', 'name avatarColor phone')
    .populate('liveShares.user', 'name avatarColor');
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (!isParticipant(trip, req.user._id)) return res.status(403).json({ message: 'Not part of this trip' });
  res.json({ trip });
});

// PUT /api/trips/:id/start (driver only)
router.put('/:id/start', protect, async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Only the driver can start the trip' });
  trip.status = 'started';
  trip.startedAt = new Date();
  trip.currentLocation = { lat: trip.pickup.lat, lng: trip.pickup.lng, updatedAt: new Date() };
  await trip.save();
  req.app.get('io').to(`trip:${trip._id}`).emit('trip:status', { tripId: trip._id, status: trip.status });
  res.json({ trip });
});

// PUT /api/trips/:id/location  (driver pushes live location; also broadcast via socket, this is REST fallback)
router.put('/:id/location', protect, async (req, res) => {
  const { lat, lng } = req.body;
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Only the driver can update location' });
  trip.currentLocation = { lat, lng, updatedAt: new Date() };
  trip.status = 'in_progress';
  trip.trackHistory.push({ lat, lng });
  await trip.save();
  req.app.get('io').to(`trip:${trip._id}`).emit('trip:location', { tripId: trip._id, lat, lng, updatedAt: trip.currentLocation.updatedAt });
  res.json({ ok: true });
});

// PUT /api/trips/:id/complete (driver only)
router.put('/:id/complete', protect, async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Only the driver can complete the trip' });
  trip.status = 'completed';
  trip.completedAt = new Date();
  await trip.save();
  req.app.get('io').to(`trip:${trip._id}`).emit('trip:status', { tripId: trip._id, status: trip.status });
  res.json({ trip });
});

// GET /api/trips/:id/messages
router.get('/:id/messages', protect, async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (!isParticipant(trip, req.user._id)) return res.status(403).json({ message: 'Not part of this trip' });
  const messages = await Message.find({ trip: trip._id }).populate('sender', 'name avatarColor').sort('createdAt');
  res.json({ messages });
});

module.exports = router;
