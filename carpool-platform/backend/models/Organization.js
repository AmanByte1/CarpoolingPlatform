const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true }, // e.g. acme.com
    code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // short org code for signup
    fuelCostPerLitre: { type: Number, default: 100 },
    avgMileageKmpl: { type: Number, default: 15 },
    costPerKm: { type: Number, default: 8 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
