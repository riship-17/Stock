const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/stocktracker';
  let retries = 5;

  while (retries > 0) {
    try {
      await mongoose.connect(uri);
      console.log(`✅ MongoDB connected: ${uri}`);
      return;
    } catch (err) {
      retries -= 1;
      console.error(`❌ MongoDB connection failed. Retries left: ${retries}`, err.message);
      if (retries === 0) {
        console.error('MongoDB connection exhausted. Exiting.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;
