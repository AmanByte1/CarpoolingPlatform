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

// Improved Perlin-like noise function for smooth, natural curves
// Creates realistic road patterns without being random
function smoothNoise(x, seed = 0) {
  // Sine-based noise that smoothly transitions
  const value =
    0.5 * Math.sin(x * Math.PI + seed) +
    0.3 * Math.sin(x * Math.PI * 2 + seed * 0.5) +
    0.2 * Math.sin(x * Math.PI * 4 + seed * 0.25);
  return value;
}

// Generate multi-layer curves for realistic road patterns
// Combines major curves (highways) with minor curves (local roads)
function generateMultiLayerCurves(t, distance, seed) {
  // Major curves (long sweeping roads like highways) - 1-2 curves per route
  const majorCurve = Math.sin(t * Math.PI * 1.5) * 0.004 * (distance / 10);

  // Medium curves (regional roads) - 3-4 curves per route
  const mediumCurve = Math.sin(t * Math.PI * 3.5 + seed) * 0.0025 * (distance / 15);

  // Minor curves (local roads) - many small curves
  const minorCurve = smoothNoise(t * 5 + seed * 0.1) * 0.0015 * (distance / 20);

  // Subtle random variation (real roads aren't perfectly smooth)
  const randomJitter = (Math.sin(t * 10 + seed * 2) - 0.5) * 0.0003;

  return majorCurve + mediumCurve + minorCurve + randomJitter;
}

// Builds highly realistic route with multi-layer curves and adaptive waypoints
function buildRoute(pickup, destination) {
// Fallback when OSRM is unavailable — interpolated straight line with slight jitter
function buildSimulatedRoute(pickup, destination) {
  const straightKm = distanceKm(pickup, destination);
  const distanceKmRounded = Math.max(0.5, Math.round(straightKm * 1.25 * 10) / 10);
  const avgSpeedKmph = 32;
  const durationMin = Math.max(3, Math.round((distanceKmRounded / avgSpeedKmph) * 60));

  // Adaptive waypoint calculation:
  // More dense for shorter routes (better granularity)
  // Less dense for very long routes (performance)
  // Formula: ~2-3 waypoints per km
  let numWaypoints;
  if (straightKm < 5) {
    numWaypoints = 15; // Short routes: dense waypoints
  } else if (straightKm < 20) {
    numWaypoints = Math.ceil(straightKm * 2.5); // Medium routes
  } else if (straightKm < 100) {
    numWaypoints = Math.ceil(straightKm * 1.8); // Long routes
  } else {
    numWaypoints = Math.min(150, Math.ceil(straightKm * 1.2)); // Very long routes (capped at 150)
  }

  const polyline = [];
// <<<<<<< Updated upstream
  const seed = (pickup.lat + pickup.lng) * 1000; // Consistent seed based on pickup location

  // Direction vector for more realistic perpendicular deviations
  const dLat = destination.lat - pickup.lat;
  const dLng = destination.lng - pickup.lng;

  for (let i = 0; i <= numWaypoints; i++) {
    const t = i / numWaypoints; // Progress along the route (0 to 1)

    // Generate multi-layer realistic curves
    const latDeviation = generateMultiLayerCurves(t, straightKm, seed);
    const lngDeviation = generateMultiLayerCurves(t, straightKm, seed + 100);

    // Scale deviations based on direction (more noticeable perpendicular to route direction)
    // This creates curves that feel like actual road navigation
    const magnitude = Math.sqrt(dLat * dLat + dLng * dLng);
    const perpLat = magnitude > 0 ? -dLng / magnitude : 0;
    const perpLng = magnitude > 0 ? dLat / magnitude : 0;

    const totalLatDeviation = latDeviation * Math.abs(perpLat) + lngDeviation * 0.5;
    const totalLngDeviation = lngDeviation * Math.abs(perpLng) + latDeviation * 0.5;

// =======
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jitter = Math.sin(t * Math.PI) * 0.0025 * (i % 2 === 0 ? 1 : -1);
// >>>>>>> Stashed changes
    polyline.push({
      lat: pickup.lat + dLat * t + totalLatDeviation,
      lng: pickup.lng + dLng * t + totalLngDeviation,
    });
  }

  // Smooth the polyline end points to avoid sharp angles at pickup/destination
  if (polyline.length > 1) {
    polyline[0] = pickup; // Force start at exact pickup location
    polyline[polyline.length - 1] = destination; // Force end at exact destination
  }

  return { distanceKm: distanceKmRounded, durationMin, polyline };
}

// Fetch real road route from OSRM (free, no API key needed)
async function fetchOsrmRoute(pickup, destination) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const polyline = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    const distanceKmRounded = Math.max(0.5, Math.round((route.distance / 1000) * 10) / 10);
    const durationMin = Math.max(1, Math.round(route.duration / 60));

    return { distanceKm: distanceKmRounded, durationMin, polyline };
  } finally {
    clearTimeout(timer);
  }
}

// Builds a road-following route via OSRM; falls back to simulated route on failure
async function buildRoute(pickup, destination) {
  try {
    const osrmRoute = await fetchOsrmRoute(pickup, destination);
    if (osrmRoute && osrmRoute.polyline.length > 1) return osrmRoute;
  } catch {
    // OSRM unavailable — use fallback below
  }
  return buildSimulatedRoute(pickup, destination);
}

module.exports = { distanceKm, buildRoute };
