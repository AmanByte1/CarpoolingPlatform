const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isValidPhone } = require('../utils/validate');

const router = express.Router();

// Helper function to validate phone
const validatePhone = (phone) => {
  const phoneStr = String(phone).trim();
  return /^\d{10,11}$/.test(phoneStr);
};

// Helper function to validate coordinates
const validateCoordinates = (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
};

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('organization');
  res.json({ user: user.toSafeObject() });
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
<<<<<<< Updated upstream
  try {
    const { name, phone, avatarColor } = req.body;
    const user = await User.findById(req.user._id);

    // Validate name if provided
    if (name) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({ message: 'Name must be 2-100 characters' });
      }
      user.name = trimmedName;
    }

    // Validate and update phone if provided
    if (phone) {
      if (!validatePhone(phone)) {
        return res.status(400).json({ message: 'Phone must be 10-11 digits only' });
      }
      user.phone = parseInt(String(phone), 10);
    }

    // Validate avatarColor if provided (hex color code)
    if (avatarColor) {
      if (!/^#[0-9A-F]{6}$/i.test(avatarColor)) {
        return res.status(400).json({ message: 'Invalid color format (must be hex like #1FAE86)' });
      }
      user.avatarColor = avatarColor;
    }

    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    console.error('[users/profile]', err.message);
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
=======
  const { name, phone, avatarColor } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name.trim();
  if (phone) {
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Phone must be a 10-digit number starting with 6–9' });
    }
    user.phone = String(phone).trim();
  }
  if (avatarColor) user.avatarColor = avatarColor;
  await user.save();
  res.json({ user: user.toSafeObject() });
>>>>>>> Stashed changes
});

// Saved places (Home / Office / Custom)
// POST /api/users/saved-places
router.post('/saved-places', protect, async (req, res) => {
  try {
    const { label, address, lat, lng } = req.body;
    if (!label || !address || lat == null || lng == null) {
      return res.status(400).json({ message: 'label, address, lat and lng are required' });
    }

    // Validate label
    const trimmedLabel = String(label).trim();
    if (trimmedLabel.length < 2 || trimmedLabel.length > 50) {
      return res.status(400).json({ message: 'Label must be 2-50 characters' });
    }

    // Validate address
    const trimmedAddress = String(address).trim();
    if (trimmedAddress.length < 5 || trimmedAddress.length > 200) {
      return res.status(400).json({ message: 'Address must be 5-200 characters' });
    }

    // Validate coordinates (lat: -90 to 90, lng: -180 to 180)
    if (!validateCoordinates(lat, lng)) {
      return res.status(400).json({ message: 'Invalid coordinates. Latitude must be -90 to 90, Longitude must be -180 to 180' });
    }

    // Check max saved places (e.g., max 10 places)
    const user = await User.findById(req.user._id);
    if (user.savedPlaces.length >= 10) {
      return res.status(400).json({ message: 'Maximum 10 saved places allowed' });
    }

    user.savedPlaces.push({ label: trimmedLabel, address: trimmedAddress, lat: Number(lat), lng: Number(lng) });
    await user.save();
    res.status(201).json({ savedPlaces: user.savedPlaces });
  } catch (err) {
    console.error('[users/saved-places]', err.message);
    res.status(500).json({ message: 'Failed to save place', error: err.message });
  }
});

// DELETE /api/users/saved-places/:placeId
router.delete('/saved-places/:placeId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const initialLength = user.savedPlaces.length;
    user.savedPlaces = user.savedPlaces.filter((p) => String(p._id) !== req.params.placeId);

    if (user.savedPlaces.length === initialLength) {
      return res.status(404).json({ message: 'Saved place not found' });
    }

    await user.save();
    res.json({ savedPlaces: user.savedPlaces });
  } catch (err) {
    console.error('[users/saved-places-delete]', err.message);
    res.status(500).json({ message: 'Failed to delete place', error: err.message });
  }
});

module.exports = router;