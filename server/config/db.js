// config/db.js
import mongoose from 'mongoose';

let isConnected = false; // Track connection

export default async function connectDB() {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    isConnected = db.connections[0].readyState;
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err);
    throw new Error('DB connection failed');
  }
}
