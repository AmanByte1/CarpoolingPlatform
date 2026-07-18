const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const savedPlaceSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // Home, Office, etc.
    address: { type: String, required: true },
    lat: Number,
    lng: Number,
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          // Must be 10-11 digits
          return /^\d{10,11}$/.test(v.toString());
        },
        message: 'Phone must be 10-11 digits only (no letters or special characters)',
      },
    },
    role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    avatarColor: { type: String, default: '#1FAE86' },
    walletBalance: { type: Number, default: 0 },
    savedPlaces: [savedPlaceSchema],
    ratingAvg: { type: Number, default: 5 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);