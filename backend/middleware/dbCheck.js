import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

// Middleware to check if database is connected and attempt reconnection if needed
export const checkDBConnection = async (req, res, next) => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    return next(); // Already connected
  }

  // If connecting, wait a bit
  if (mongoose.connection.readyState === 2) {
    return res.status(503).json({ 
      message: "Database is connecting. Please try again in a moment.",
      error: "Database connecting"
    });
  }

  // If disconnected, try to reconnect (only in production/Vercel)
  if (mongoose.connection.readyState === 0 && process.env.NODE_ENV === "production") {
    try {
      await connectDB();
      if (mongoose.connection.readyState === 1) {
        return next();
      }
    } catch (error) {
      console.error("❌ Failed to reconnect to database:", error.message);
    }
  }

  // Still not connected
  return res.status(503).json({ 
    message: "Database connection not available. Please try again in a moment.",
    error: "Database not connected",
    state: mongoose.connection.readyState
  });
};

