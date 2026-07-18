const express = require('express');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Ride = require('../models/Ride');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();
router.use(protect, requireRole('admin'));

// GET /api/admin/organization
router.get('/organization', async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organization);
    res.json({ organization: org });
  } catch (err) {
    console.error('[admin/organization]', err.message);
    res.status(500).json({ message: 'Failed to fetch organization', error: err.message });
  }
});

// PUT /api/admin/organization
router.put('/organization', async (req, res) => {
  try {
    const { fuelCostPerLitre, avgMileageKmpl, costPerKm } = req.body;
    const org = await Organization.findById(req.user.organization);

    // Validate fuelCostPerLitre if provided
    if (fuelCostPerLitre != null) {
      const fuel = Number(fuelCostPerLitre);
      if (fuel <= 0 || fuel > 1000) {
        return res.status(400).json({ message: 'Fuel cost must be between 0.1 and 1000' });
      }
      org.fuelCostPerLitre = fuel;
    }

    // Validate avgMileageKmpl if provided
    if (avgMileageKmpl != null) {
      const mileage = Number(avgMileageKmpl);
      if (mileage <= 0 || mileage > 100) {
        return res.status(400).json({ message: 'Mileage must be between 0.1 and 100' });
      }
      org.avgMileageKmpl = mileage;
    }

    // Validate costPerKm if provided
    if (costPerKm != null) {
      const cost = Number(costPerKm);
      if (cost <= 0 || cost > 500) {
        return res.status(400).json({ message: 'Cost per km must be between 0.1 and 500' });
      }
      org.costPerKm = cost;
    }

    await org.save();
    res.json({ organization: org });
  } catch (err) {
    console.error('[admin/organization-update]', err.message);
    res.status(500).json({ message: 'Failed to update organization', error: err.message });
  }
});

// GET /api/admin/employees
router.get('/employees', async (req, res) => {
  try {
    const employees = await User.find({ organization: req.user.organization }).select('-password').sort('-createdAt');
    res.json({ employees });
  } catch (err) {
    console.error('[admin/employees]', err.message);
    res.status(500).json({ message: 'Failed to fetch employees', error: err.message });
  }
});

// PUT /api/admin/employees/:id/toggle-access
router.put('/employees/:id/toggle-access', async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    employee.isActive = !employee.isActive;
    await employee.save();
    res.json({ employee: employee.toSafeObject() });
  } catch (err) {
    console.error('[admin/toggle-access]', err.message);
    res.status(500).json({ message: 'Failed to update employee', error: err.message });
  }
});

// GET /api/admin/vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const employees = await User.find({ organization: req.user.organization }).select('_id');
    const ids = employees.map((e) => e._id);
    const vehicles = await Vehicle.find({ owner: { $in: ids } }).populate('owner', 'name email');
    res.json({ vehicles });
  } catch (err) {
    console.error('[admin/vehicles]', err.message);
    res.status(500).json({ message: 'Failed to fetch vehicles', error: err.message });
  }
});

// GET /api/admin/stats  -> org-wide dashboard for Company Administration
router.get('/stats', async (req, res) => {
  try {
    const orgId = req.user.organization;
    const employees = await User.find({ organization: orgId }).select('_id');
    const ids = employees.map((e) => e._id);

    const [totalEmployees, activeEmployees, totalVehicles, completedTrips, activeRides] = await Promise.all([
      User.countDocuments({ organization: orgId }),
      User.countDocuments({ organization: orgId, isActive: true }),
      Vehicle.countDocuments({ owner: { $in: ids }, isActive: true }),
      Trip.countDocuments({ organization: orgId, status: 'completed' }),
      Ride.countDocuments({ organization: orgId, status: 'active' }),
    ]);

    const trips = await Trip.find({ organization: orgId, status: 'completed' });
    const totalDistance = trips.reduce((s, t) => s + (t.distanceKm || 0), 0);

    res.json({
      totalEmployees,
      activeEmployees,
      totalVehicles,
      completedTrips,
      activeRides,
      totalDistance: Math.round(totalDistance * 10) / 10,
    });
  } catch (err) {
    console.error('[admin/stats]', err.message);
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
});

// GET /api/admin/business-insights
router.get('/business-insights', async (req, res) => {
  try {
    const orgId = req.user.organization;
    const org = await Organization.findById(orgId);
    const totalEmployees = await User.countDocuments({ organization: orgId });

    const trips = await Trip.find({ organization: orgId, status: 'completed' }).populate('passengers.user', '_id');

    let passengerLegs = 0;
    let passengerLegKm = 0;
    let totalDriverKm = 0;
    const participantIds = new Set();

    trips.forEach((t) => {
      totalDriverKm += t.distanceKm || 0;
      participantIds.add(String(t.driver));
      t.passengers.forEach((p) => {
        passengerLegs += 1;
        passengerLegKm += t.distanceKm || 0;
        participantIds.add(String(p.user._id || p.user));
      });
    });

    const costPerKm = org?.costPerKm || 8;
    const avgMileageKmpl = org?.avgMileageKmpl || 15;
    const fuelCostPerLitre = org?.fuelCostPerLitre || 100;
    const co2PerKm = 0.12; // kg CO2 per km for an average passenger car (avoided emissions)

    const costSaved = Math.round(passengerLegKm * costPerKm);
    const fuelLitresSaved = Math.round((passengerLegKm / avgMileageKmpl) * 10) / 10;
    const fuelCostSaved = Math.round(fuelLitresSaved * fuelCostPerLitre);
    const co2SavedKg = Math.round(passengerLegKm * co2PerKm * 10) / 10;
    const avgOccupancy = trips.length ? Math.round(((trips.length + passengerLegs) / trips.length) * 10) / 10 : 1;
    const participationRate = totalEmployees ? Math.round((participantIds.size / totalEmployees) * 1000) / 10 : 0;

    const daysActive = trips.length
      ? Math.max(1, Math.ceil((Date.now() - new Date(trips[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    const projectedMonthlyCostSaved = Math.round((costSaved / daysActive) * 30);
    const projectedMonthlyCo2Saved = Math.round((co2SavedKg / daysActive) * 30 * 10) / 10;

    res.json({
      totalTripsCompleted: trips.length,
      passengerLegs,
      totalDistance: Math.round((totalDriverKm + passengerLegKm) * 10) / 10,
      costSaved,
      fuelLitresSaved,
      fuelCostSaved,
      co2SavedKg,
      avgOccupancy,
      participationRate,
      participatingEmployees: participantIds.size,
      totalEmployees,
      projectedMonthlyCostSaved,
      projectedMonthlyCo2Saved,
    });
  } catch (err) {
    console.error('[admin/business-insights]', err.message);
    res.status(500).json({ message: 'Failed to fetch insights', error: err.message });
  }
});

module.exports = router;