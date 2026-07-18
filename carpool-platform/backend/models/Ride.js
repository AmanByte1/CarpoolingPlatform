const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    pickup: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    distanceKm: { type: Number, required: true },
    durationMin: { type: Number, required: true },
    routePolyline: [{ lat: Number, lng: Number }],
    departureAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          const now = new Date();
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() + 1);
          // Allow departure today or within 1 year from now
          return v >= now && v <= maxDate;
        },
        message: 'Departure date must be today or within 1 year from now',
      },
    },
    availableSeats: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    farePerSeat: { type: Number, required: true },
    isRecurring: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'full', 'cancelled', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

rideSchema.index({ 'pickup.lat': 1, 'pickup.lng': 1 });
rideSchema.index({ departureAt: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);