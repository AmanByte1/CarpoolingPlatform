const mongoose = require('mongoose');

// Wallet balance is stored directly on User for simplicity; this model
// exists to keep a clean domain name for wallet-specific settings if needed.
const walletSettingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    autoRechargeEnabled: { type: Boolean, default: false },
    autoRechargeThreshold: { type: Number, default: 0 },
    autoRechargeAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WalletSettings', walletSettingsSchema);
