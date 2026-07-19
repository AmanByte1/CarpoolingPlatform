const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    model: { type: String, required: true },
    registrationNumber: { type: String, required: true, uppercase: true, trim: true },
    seatingCapacity: { type: Number, required: true, min: 1, max: 8 },
    color: { type: String, default: 'White' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
