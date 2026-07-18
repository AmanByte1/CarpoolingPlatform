const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    model: { type: String, required: true, trim: true },
    registrationNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Accept formats like: DL-01AB1234, MH02AB1234, etc. (flexible for different regions)
          return /^[A-Z0-9\-]{4,15}$/.test(v);
        },
        message: 'Invalid vehicle registration number format (4-15 alphanumeric characters)',
      },
    },
    seatingCapacity: {
      type: Number,
      required: true,
      min: [1, 'Minimum 1 seat required'],
      max: [8, 'Maximum 8 seats allowed'],
      validate: {
        validator: Number.isInteger,
        message: 'Seating capacity must be a whole number',
      },
    },
    color: { type: String, default: 'White', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for owner + registration to prevent duplicates per owner
vehicleSchema.index({ owner: 1, registrationNumber: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);