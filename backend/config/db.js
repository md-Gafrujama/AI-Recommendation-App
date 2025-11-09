import mongoose from "mongoose";

let isConnecting = false;
let connectionPromise = null;

export const connectDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB already connected");
    return mongoose.connection;
  }

  // If already connecting, return the existing promise
  if (isConnecting && connectionPromise) {
    console.log("⏳ MongoDB connection in progress, waiting...");
    return connectionPromise;
  }

  // Check if MONGO_URI is set
  if (!process.env.MONGO_URI) {
    const error = new Error("MONGO_URI is not defined in environment variables");
    console.error("❌", error.message);
    throw error;
  }

  // Start connection
  isConnecting = true;
  console.log("🔄 Attempting to connect to MongoDB...");
  
  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000, // 15 seconds timeout for serverless
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000, // 15 seconds to establish connection
    maxPoolSize: 1, // For serverless, use smaller pool
    minPoolSize: 0, // Allow no connections when idle
    bufferCommands: false, // Disable mongoose buffering (critical for serverless)
    retryWrites: true,
    w: 'majority',
  })
    .then(() => {
      isConnecting = false;
      connectionPromise = null;
      console.log("✅ MongoDB connected successfully");
      return mongoose.connection;
    })
    .catch((error) => {
      isConnecting = false;
      connectionPromise = null;
      console.error("❌ DB connection failed:", {
        message: error.message,
        name: error.name,
        code: error.code,
        hasMONGO_URI: !!process.env.MONGO_URI,
        mongoURILength: process.env.MONGO_URI?.length || 0
      });
      
      // Only exit in development
      if (process.env.NODE_ENV !== "production") {
        process.exit(1);
      }
      
      throw error;
    });

  return connectionPromise;
};