const express = require('express');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/summary  -> personal reports & analytics for the logged-in employee
router.get('/summary', protect, async (req, res) => {
  const trips = await Trip.find({
    $or: [{ driver: req.user._id }, { 'passengers.user': req.user._id }],
    status: 'completed',
  }).populate('vehicle', 'model registrationNumber');

  const org = req.user.organization;
  // organization fuel/cost config is fetched separately on the client via /api/admin/organization,
  // but for the per-user report we use simple defaults matched with admin-configured values.
  const totalTrips = trips.length;
  const totalDistance = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);

  const monthly = {};
  const vehicleWise = {};

  trips.forEach((t) => {
    const month = new Date(t.completedAt || t.createdAt).toLocaleString('en-US', { month: 'short', year: '2-digit' });
    monthly[month] = monthly[month] || { month, trips: 0, distance: 0 };
    monthly[month].trips += 1;
    monthly[month].distance += t.distanceKm || 0;

    if (String(t.driver) === String(req.user._id) && t.vehicle) {
      const key = t.vehicle.registrationNumber || String(t.vehicle._id);
      vehicleWise[key] = vehicleWise[key] || { vehicle: t.vehicle.model, registrationNumber: key, trips: 0, distance: 0 };
      vehicleWise[key].trips += 1;
      vehicleWise[key].distance += t.distanceKm || 0;
    }
  });

  res.json({
    totalTrips,
    totalDistance: Math.round(totalDistance * 10) / 10,
    monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
    vehicleWise: Object.values(vehicleWise),
  });
});

module.exports = router;
