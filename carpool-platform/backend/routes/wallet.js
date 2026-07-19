const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/wallet
router.get('/', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  const transactions = await Transaction.find({ user: req.user._id }).sort('-createdAt').limit(30);
  res.json({ balance: user.walletBalance, transactions });
});

// POST /api/wallet/recharge  (mock Razorpay test-mode order+capture in one step)
router.post('/recharge', protect, async (req, res) => {
  const { amount } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: 'Enter a valid amount' });

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
});

// POST /api/trips/:tripId/pay  -> pays for a completed/booked trip via cash/card/upi/wallet
router.post('/pay/:tripId', protect, async (req, res) => {
  try {
    const { method } = req.body; // cash | card | upi | wallet
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const passenger = trip.passengers.find((p) => String(p.user) === String(req.user._id));
    if (!passenger) return res.status(403).json({ message: 'Not a passenger on this trip' });
    if (passenger.paymentStatus === 'completed') return res.status(400).json({ message: 'Already paid' });

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
    res.status(500).json({ message: 'Payment failed', error: err.message });
  }
});

module.exports = router;
