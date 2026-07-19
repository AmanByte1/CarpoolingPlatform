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

// Builds a simple simulated route: a handful of interpolated points between
// pickup and destination, so the frontend can draw a polyline without a paid
// mapping API. Distance/duration are derived from the real haversine distance
// with a road-distance correction factor.
function buildRoute(pickup, destination) {
  const straightKm = distanceKm(pickup, destination);
  const distanceKmRounded = Math.max(0.5, Math.round(straightKm * 1.25 * 10) / 10); // road factor
  const avgSpeedKmph = 32;
  const durationMin = Math.max(3, Math.round((distanceKmRounded / avgSpeedKmph) * 60));

  const steps = 8;
  const polyline = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // slight jitter perpendicular to the straight line to look like a real road
    const jitter = Math.sin(t * Math.PI) * 0.0025 * (i % 2 === 0 ? 1 : -1);
    polyline.push({
      lat: pickup.lat + (destination.lat - pickup.lat) * t + jitter,
      lng: pickup.lng + (destination.lng - pickup.lng) * t + jitter,
    });
  }

  return { distanceKm: distanceKmRounded, durationMin, polyline };
}

module.exports = { distanceKm, buildRoute };
