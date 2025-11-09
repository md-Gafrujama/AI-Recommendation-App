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
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    socketTimeoutMS: 45000,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 1,
    bufferCommands: false, // Disable mongoose buffering
    bufferMaxEntries: 0, // Disable mongoose buffering
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