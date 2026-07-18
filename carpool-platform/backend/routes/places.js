const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/places/saved -> convenience alias used by Find/Offer ride pages
router.get('/saved', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ savedPlaces: user.savedPlaces });
});

module.exports = router;
