const RidgeRegression = require('./ridgeRegression');
const Ride = require('../models/Ride');

const MIN_SAMPLES = 5;

// Trains a tiny regression model on this organization's OWN historical rides
// (distanceKm, hour-of-day -> farePerSeat) so fare suggestions reflect real
// pricing patterns instead of a single hardcoded rate. Falls back to the
// organization's configured cost-per-km when there isn't enough data yet
// (cold start), which is the common real-world case for a brand new org.
async function predictFare(organizationId, distanceKm, departureAt, orgCostPerKm = 8) {
  const rides = await Ride.find({ organization: organizationId })
    .select('distanceKm farePerSeat departureAt')
    .limit(500)
    .lean();

  if (rides.length < MIN_SAMPLES) {
    return {
      suggestedFare: Math.max(10, Math.round(distanceKm * orgCostPerKm)),
      method: 'baseline',
      sampleSize: rides.length,
      confidence: 'low',
    };
  }

  const isPeakHour = (d) => {
    const h = new Date(d).getHours();
    return (h >= 8 && h <= 10) || (h >= 17 && h <= 19) ? 1 : 0;
  };

  const X = rides.map((r) => [r.distanceKm, isPeakHour(r.departureAt)]);
  const y = rides.map((r) => r.farePerSeat);

  const model = new RidgeRegression(1.0);
  model.fit(X, y);

  const predicted = model.predict([distanceKm, isPeakHour(departureAt || Date.now())]);
  const suggestedFare = Math.max(10, Math.round(predicted));

  return {
    suggestedFare,
    method: 'regression',
    sampleSize: rides.length,
    confidence: rides.length >= 20 ? 'high' : 'medium',
  };
}

module.exports = { predictFare };
