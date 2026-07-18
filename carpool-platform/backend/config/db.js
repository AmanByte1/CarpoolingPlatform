const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carpool_platform';
  try {
    await mongoose.connect(uri);
    console.log(`[db] MongoDB connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);
    const Organization = require('../models/Organization');
    const orgCount = await Organization.countDocuments();
    if (orgCount === 0) {
      console.warn('[db] WARNING: no organizations found. Run "npm run seed" in the backend folder before logging in/registering.');
    } else {
      console.log(`[db] ${orgCount} organization(s) found — ready for login/register.`);
    }
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    console.error('[db] Make sure MongoDB is running and MONGO_URI is set correctly in .env');
    process.exit(1);
  }
};

module.exports = connectDB;
