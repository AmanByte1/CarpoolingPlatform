// AI-assisted ride ranking: a multi-factor scoring model (a lightweight form
// of "learning to rank") that combines several normalized signals into a
// single 0-100 Match Score, instead of just sorting by raw distance. This is
// the "Intelligent Ride Matching" feature from the problem statement.
//
// Signals used:
//  - pickup proximity to the rider's requested pickup point
//  - destination proximity to the rider's requested destination
//  - how close the ride's departure time is to the requested time
//  - the driver's historical rating
//  - fare competitiveness relative to the other candidate rides shown
//  - "co-travel affinity" — has this rider ridden with this driver before?
//    (a simple collaborative-filtering signal: people re-book drivers they
//    had a good experience with)
//
// Weights below were hand-tuned to reasonable defaults; in production these
// would themselves be fit against booking-conversion data over time.
const WEIGHTS = {
  pickupProximity: 0.28,
  destProximity: 0.22,
  timeProximity: 0.22,
  driverRating: 0.13,
  fareCompetitiveness: 0.1,
  affinity: 0.05,
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function scoreRides(rides, { requestedTime, pastDriverIds = new Set() } = {}) {
  if (rides.length === 0) return rides;

  const fares = rides.map((r) => r.farePerSeat);
  const minFare = Math.min(...fares);
  const maxFare = Math.max(...fares);
  const requestedMs = requestedTime ? new Date(requestedTime).getTime() : null;

  return rides
    .map((ride) => {
      const pickupProximity = ride.pickupDistanceKm != null ? clamp01(1 - ride.pickupDistanceKm / 15) : 0.6;
      const destProximity = ride.destDistanceKm != null ? clamp01(1 - ride.destDistanceKm / 15) : 0.6;

      let timeProximity = 0.6;
      if (requestedMs) {
        const diffMin = Math.abs(new Date(ride.departureAt).getTime() - requestedMs) / 60000;
        timeProximity = clamp01(1 - diffMin / 60); // full score if within the same minute, 0 beyond 60 min
      }

      const driverRating = clamp01((ride.driver?.ratingAvg ?? 5) / 5);

      const fareCompetitiveness =
        maxFare === minFare ? 1 : clamp01(1 - (ride.farePerSeat - minFare) / (maxFare - minFare));

      const affinity = pastDriverIds.has(String(ride.driver?._id || ride.driver)) ? 1 : 0;

      const score =
        pickupProximity * WEIGHTS.pickupProximity +
        destProximity * WEIGHTS.destProximity +
        timeProximity * WEIGHTS.timeProximity +
        driverRating * WEIGHTS.driverRating +
        fareCompetitiveness * WEIGHTS.fareCompetitiveness +
        affinity * WEIGHTS.affinity;

      return { ...ride, matchScore: Math.round(score * 100) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { scoreRides };
