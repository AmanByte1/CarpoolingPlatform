const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seatsBooked: { type: Number, required: true, default: 1 },
    fare: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'wallet', null], default: null },
    boarded: { type: Boolean, default: false },
  },
  { _id: true }
);

const trackPointSchema = new mongoose.Schema(
  { lat: Number, lng: Number, at: { type: Date, default: Date.now } },
  { _id: false }
);

const liveShareSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, lat: Number, lng: Number, updatedAt: Date },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    passengers: [passengerSchema],
    pickup: {
      address: String, lat: Number, lng: Number,
    },
    destination: {
      address: String, lat: Number, lng: Number,
    },
    distanceKm: Number,
    departureAt: Date,
    status: {
      type: String,
      enum: ['booked', 'started', 'in_progress', 'completed', 'cancelled'],
      default: 'booked',
    },
    currentLocation: { lat: Number, lng: Number, updatedAt: Date },
    trackHistory: [trackPointSchema],
    // Lets any participant (driver or passenger) share their live position for
    // pickup coordination, independent of official trip status.
    liveShares: [liveShareSchema],
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
