const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Basic domain format validation
          return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(v);
        },
        message: 'Invalid domain format (e.g., company.com)',
      },
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Alphanumeric only, 3-10 characters
          return /^[A-Z0-9]{3,10}$/.test(v);
        },
        message: 'Code must be 3-10 alphanumeric characters',
      },
    },
    fuelCostPerLitre: {
      type: Number,
      default: 100,
      min: [0.1, 'Fuel cost must be greater than 0'],
      max: [1000, 'Fuel cost exceeds maximum'],
      validate: {
        validator: function (v) {
          return v > 0 && Number.isFinite(v);
        },
        message: 'Invalid fuel cost value',
      },
    },
    avgMileageKmpl: {
      type: Number,
      default: 15,
      min: [0.1, 'Mileage must be greater than 0'],
      max: [100, 'Mileage exceeds maximum'],
      validate: {
        validator: function (v) {
          return v > 0 && Number.isFinite(v);
        },
        message: 'Invalid mileage value',
      },
    },
    costPerKm: {
      type: Number,
      default: 8,
      min: [0.1, 'Cost per km must be greater than 0'],
      max: [500, 'Cost per km exceeds maximum'],
      validate: {
        validator: function (v) {
          return v > 0 && Number.isFinite(v);
        },
        message: 'Invalid cost per km value',
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);