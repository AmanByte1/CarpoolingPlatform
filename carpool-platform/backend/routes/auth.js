const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Helper function to validate phone number
const validatePhone = (phone) => {
  const phoneStr = String(phone).trim();
  // Must be 10-11 digits, no letters or special characters
  return /^\d{10,11}$/.test(phoneStr);
};

// Helper function to validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

// Helper function to validate password strength
// Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
const validatePasswordStrength = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, orgCode } = req.body;
    if (!name || !email || !password || !phone || !orgCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate name (trim, not empty)
    const trimmedName = String(name).trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ message: 'Name must be 2-100 characters' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)',
      });
    }

    // Validate phone format (integer digits only)
    if (!validatePhone(phone)) {
      return res.status(400).json({ message: 'Phone must be 10-11 digits only' });
    }

    const organization = await Organization.findOne({ code: orgCode.trim().toUpperCase(), isActive: true });
    if (!organization) {
      return res.status(400).json({ message: 'Invalid organization code' });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Convert phone to number
    const phoneNumber = parseInt(String(phone), 10);

    const user = await User.create({
      name: trimmedName,
      email: email.trim().toLowerCase(),
      password,
      phone: phoneNumber,
      organization: organization._id,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeObject(), organization });
  } catch (err) {
    console.error('[auth/register]', err.message);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: (email || '').trim().toLowerCase() })
      .select('+password')
      .populate('organization');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated by your administrator' });
    }
    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('organization');
  res.json({ user: user.toSafeObject() });
});

module.exports = router;