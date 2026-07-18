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
  try {
    const { model, registrationNumber, seatingCapacity, color } = req.body;
    if (!model || !registrationNumber || seatingCapacity == null) {
      return res.status(400).json({ message: 'model, registrationNumber and seatingCapacity are required' });
    }

    // Validate model
    const trimmedModel = String(model).trim();
    if (trimmedModel.length < 2 || trimmedModel.length > 100) {
      return res.status(400).json({ message: 'Model must be 2-100 characters' });
    }

    // Validate seating capacity
    const capacity = Number(seatingCapacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 8) {
      return res.status(400).json({ message: 'Seating capacity must be a number between 1 and 8' });
    }

    const vehicle = await Vehicle.create({
      owner: req.user._id,
      model: trimmedModel,
      registrationNumber: registrationNumber.toString().toUpperCase().trim(),
      seatingCapacity: capacity,
      color: color ? String(color).trim() : 'White',
    });
    res.status(201).json({ vehicle });
  } catch (err) {
    console.error('[vehicles/create]', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This registration number already exists for your account' });
    }
    res.status(500).json({ message: 'Failed to add vehicle', error: err.message });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const { model, registrationNumber, seatingCapacity, color } = req.body;

    // Validate model if provided
    if (model) {
      const trimmedModel = String(model).trim();
      if (trimmedModel.length < 2 || trimmedModel.length > 100) {
        return res.status(400).json({ message: 'Model must be 2-100 characters' });
      }
      vehicle.model = trimmedModel;
    }

    // Validate seating capacity if provided
    if (seatingCapacity != null) {
      const capacity = Number(seatingCapacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 8) {
        return res.status(400).json({ message: 'Seating capacity must be between 1 and 8' });
      }
      vehicle.seatingCapacity = capacity;
    }

    // Validate registration number if provided
    if (registrationNumber) {
      vehicle.registrationNumber = registrationNumber.toString().toUpperCase().trim();
    }

    if (color) {
      vehicle.color = String(color).trim();
    }

    await vehicle.save();
    res.json({ vehicle });
  } catch (err) {
    console.error('[vehicles/update]', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This registration number already exists for your account' });
    }
    res.status(500).json({ message: 'Failed to update vehicle', error: err.message });
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle removed successfully' });
  } catch (err) {
    console.error('[vehicles/delete]', err.message);
    res.status(500).json({ message: 'Failed to delete vehicle', error: err.message });
  }
});

module.exports = router;