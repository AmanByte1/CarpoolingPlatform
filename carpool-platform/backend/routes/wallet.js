const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/wallet
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const transactions = await Transaction.find({ user: req.user._id }).sort('-createdAt').limit(30);
    res.json({ balance: user.walletBalance, transactions });
  } catch (err) {
    console.error('[wallet/get]', err.message);
    res.status(500).json({ message: 'Failed to fetch wallet', error: err.message });
  }
});

// POST /api/wallet/recharge  (mock Razorpay test-mode order+capture in one step)
router.post('/recharge', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const amt = Number(amount);

    // Validate amount
    if (!amt || amt <= 0) {
      return res.status(400).json({ message: 'Enter a valid amount (must be greater than 0)' });
    }

    // Max recharge limit per transaction: 100000 (1 lakh)
    if (amt > 100000) {
      return res.status(400).json({ message: 'Recharge amount cannot exceed 100000' });
    }

    // Check decimal precision (max 2 decimal places)
    if (!Number.isFinite(amt) || (amt * 100) % 1 !== 0) {
      return res.status(400).json({ message: 'Amount must have maximum 2 decimal places' });
    }

    // simulate a Razorpay test-mode payment id
    const gatewayRef = `rzp_test_${crypto.randomBytes(8).toString('hex')}`;

    const user = await User.findById(req.user._id);
    user.walletBalance += amt;
    await user.save();

    const tx = await Transaction.create({
      user: user._id,
      type: 'recharge',
      amount: amt,
      method: 'card',
      status: 'success',
      gatewayRef,
      note: 'Wallet recharge (Razorpay test mode)',
    });

    res.status(201).json({ balance: user.walletBalance, transaction: tx });
  } catch (err) {
    console.error('[wallet/recharge]', err.message);
    res.status(500).json({ message: 'Recharge failed', error: err.message });
  }
});

// POST /api/trips/:tripId/pay  -> pays for a completed/booked trip via cash/card/upi/wallet
router.post('/pay/:tripId', protect, async (req, res) => {
  try {
    const { method } = req.body; // cash | card | upi | wallet

    if (!method || !['cash', 'card', 'upi', 'wallet'].includes(method)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const passenger = trip.passengers.find((p) => String(p.user) === String(req.user._id));
    if (!passenger) return res.status(403).json({ message: 'Not a passenger on this trip' });
    if (passenger.paymentStatus === 'completed') return res.status(400).json({ message: 'Already paid' });

    // Validate fare
    if (!passenger.fare || passenger.fare <= 0) {
      return res.status(400).json({ message: 'Invalid trip fare' });
    }

    if (method === 'wallet') {
      const user = await User.findById(req.user._id);
      if (user.walletBalance < passenger.fare) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      user.walletBalance -= passenger.fare;
      await user.save();
    }

    passenger.paymentStatus = 'completed';
    passenger.paymentMethod = method;
    await trip.save();

    const gatewayRef = method === 'cash' ? null : `rzp_test_${crypto.randomBytes(8).toString('hex')}`;

    await Transaction.create({
      user: req.user._id,
      trip: trip._id,
      type: 'ride_payment',
      amount: passenger.fare,
      method,
      status: 'success',
      gatewayRef,
      note: `Payment for trip ${trip._id}`,
    });

    // credit the driver's earnings record (not wallet balance directly, kept as a ledger entry)
    await Transaction.create({
      user: trip.driver,
      trip: trip._id,
      type: 'ride_earning',
      amount: passenger.fare,
      method,
      status: 'success',
      note: `Earning from trip ${trip._id}`,
    });

    res.json({ trip });
  } catch (err) {
    console.error('[wallet/pay]', err.message);
    res.status(500).json({ message: 'Payment failed', error: err.message });
  }
});

module.exports = router;