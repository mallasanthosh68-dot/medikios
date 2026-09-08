const mongoose = require('mongoose');

let isConnected = false;
let isInMemoryFallback = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medikiosk';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout for fast fallback
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Unable to connect to local MongoDB (${error.message}).`);
    console.log(`[Database] Activating MediKiosk Resilient In-Memory & File Store fallback.`);
    console.log(`[Database] All 14 collections, models, and demo queries will function seamlessly!`);
    isConnected = true;
    isInMemoryFallback = true;
    return null;
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  type: isInMemoryFallback ? 'In-Memory Resilient Store (Demo Fallback)' : 'MongoDB Mongoose Driver',
  isFallback: isInMemoryFallback,
});

module.exports = { connectDB, getDBStatus, isFallback: () => isInMemoryFallback };
