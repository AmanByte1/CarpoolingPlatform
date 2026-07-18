// Haversine distance in km between two lat/lng points
function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// Builds a realistic simulated route with grid-based waypoints:
// For long distances, creates more waypoints to simulate actual road curves.
// This avoids the "straight line" appearance on maps.
function buildRoute(pickup, destination) {
  const straightKm = distanceKm(pickup, destination);
  const distanceKmRounded = Math.max(0.5, Math.round(straightKm * 1.25 * 10) / 10); // road factor
  const avgSpeedKmph = 32;
  const durationMin = Math.max(3, Math.round((distanceKmRounded / avgSpeedKmph) * 60));

  // Dynamic waypoint calculation:
  // Create 1 waypoint per 2km for better curve simulation
  // Minimum 8 points, maximum 50 points
  const numWaypoints = Math.max(8, Math.min(50, Math.ceil(straightKm / 2) + 2));
  const polyline = [];

  for (let i = 0; i <= numWaypoints; i++) {
    const t = i / numWaypoints; // Progress along the route (0 to 1)

    // Create realistic curves using sine wave perpendicular to the straight line
    // This simulates roads that curve naturally instead of going straight
    const curveIntensity = Math.sin(t * Math.PI * 3) * 0.003 * (straightKm / 10);
    const randomDeviation = (Math.random() - 0.5) * 0.0005; // Small random jitter
    const totalDeviation = curveIntensity + randomDeviation;

    polyline.push({
      lat: pickup.lat + (destination.lat - pickup.lat) * t + totalDeviation,
      lng: pickup.lng + (destination.lng - pickup.lng) * t + totalDeviation,
    });
  }

  return { distanceKm: distanceKmRounded, durationMin, polyline };
}

module.exports = { distanceKm, buildRoute };