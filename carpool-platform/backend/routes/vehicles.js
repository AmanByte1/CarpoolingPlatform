const express = require('express');
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/vehicles  (current user's vehicles)
router.get('/', protect, async (req, res) => {
  const vehicles = await Vehicle.find({ owner: req.user._id }).sort('-createdAt');
  res.json({ vehicles });
});

// POST /api/vehicles
router.post('/', protect, async (req, res) => {
  const { model, registrationNumber, seatingCapacity, color } = req.body;
  if (!model || !registrationNumber || !seatingCapacity) {
    return res.status(400).json({ message: 'model, registrationNumber and seatingCapacity are required' });
  }
  const vehicle = await Vehicle.create({
    owner: req.user._id,
    model,
    registrationNumber,
    seatingCapacity,
    color,
  });
  res.status(201).json({ vehicle });
});

// PUT /api/vehicles/:id
router.put('/:id', protect, async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  Object.assign(vehicle, req.body);
  await vehicle.save();
  res.json({ vehicle });
});

// DELETE /api/vehicles/:id
router.delete('/:id', protect, async (req, res) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { isActive: false },
    { new: true }
  );
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json({ message: 'Vehicle removed' });
});

module.exports = router;
