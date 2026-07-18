const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('organization');
  res.json({ user: user.toSafeObject() });
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  const { name, phone, avatarColor } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (avatarColor) user.avatarColor = avatarColor;
  await user.save();
  res.json({ user: user.toSafeObject() });
});

// Saved places (Home / Office / Custom)
// POST /api/users/saved-places
router.post('/saved-places', protect, async (req, res) => {
  const { label, address, lat, lng } = req.body;
  if (!label || !address || lat == null || lng == null) {
    return res.status(400).json({ message: 'label, address, lat and lng are required' });
  }
  const user = await User.findById(req.user._id);
  user.savedPlaces.push({ label, address, lat, lng });
  await user.save();
  res.status(201).json({ savedPlaces: user.savedPlaces });
});

// DELETE /api/users/saved-places/:placeId
router.delete('/saved-places/:placeId', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.savedPlaces = user.savedPlaces.filter((p) => String(p._id) !== req.params.placeId);
  await user.save();
  res.json({ savedPlaces: user.savedPlaces });
});

module.exports = router;
