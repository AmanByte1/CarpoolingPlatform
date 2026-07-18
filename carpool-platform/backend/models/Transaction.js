const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    type: { type: String, enum: ['recharge', 'ride_payment', 'ride_earning', 'refund'], required: true },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          // Must be positive and maximum 500000 (5 lakh)
          return v > 0 && v <= 500000 && Number.isFinite(v);
        },
        message: 'Amount must be between 0.01 and 500000',
      },
    },
    method: { type: String, enum: ['cash', 'card', 'upi', 'wallet', 'system'], required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    gatewayRef: { type: String }, // mock razorpay ref
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);