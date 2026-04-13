const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      console.log('Warning: MONGODB_URI not defined. Using local MongoDB.');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/secure-datacard';
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server will continue without database connection.');
    console.log('Please set up MongoDB Atlas or install MongoDB locally.');
    console.log('See: https://www.mongodb.com/cloud/atlas for free cloud database');
    return false;
  }
};

module.exports = connectDB;
