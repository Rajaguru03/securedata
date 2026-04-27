const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Checking if the MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      console.log('Warning: MONGODB_URI not defined. Use local MongoDB.');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/secure-datacard';
    }

    const con = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${con.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Please set up MongoDB Atlas or install MongoDB locally.');
    return false;
  }
};

module.exports = connectDB;
