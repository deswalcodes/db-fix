const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas connected');
  } catch (err) {
    console.error('❌ DB connection error:', err.message);
    process.exit(1); // Stop server if DB fails
  }
};

module.exports = connectDB;
