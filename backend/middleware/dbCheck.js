import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

// Middleware to check if database is connected and attempt reconnection if needed
export const checkDBConnection = async (req, res, next) => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const state = mongoose.connection.readyState;
  
  // Already connected
  if (state === 1) {
    return next();
  }

  // If connecting, wait for it (with timeout)
  if (state === 2) {
    try {
      // Wait up to 5 seconds for connection to complete
      await Promise.race([
        new Promise((resolve) => {
          mongoose.connection.once("connected", resolve);
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Connection timeout")), 5000);
        })
      ]);
      return next();
    } catch (error) {
      console.error("⏱️ Connection wait timeout:", error.message);
    }
  }

  // If disconnected, try to reconnect
  if (state === 0) {
    try {
      console.log("🔄 Attempting to connect database on request...");
      await connectDB();
      
      // Double check after connection attempt
      if (mongoose.connection.readyState === 1) {
        console.log("✅ Database connected successfully");
        return next();
      }
    } catch (error) {
      console.error("❌ Failed to connect to database:", {
        message: error.message,
        hasMONGO_URI: !!process.env.MONGO_URI,
        state: mongoose.connection.readyState
      });
      
      // Return detailed error for debugging
      return res.status(503).json({ 
        message: "Database connection failed. Please check server configuration.",
        error: error.message || "Database not connected",
        state: mongoose.connection.readyState,
        hint: process.env.MONGO_URI ? "Connection string exists but connection failed" : "MONGO_URI environment variable is missing"
      });
    }
  }

  // Still not connected after all attempts
  return res.status(503).json({ 
    message: "Database connection not available. Please try again in a moment.",
    error: "Database not connected",
    state: mongoose.connection.readyState,
    hint: "Check Vercel environment variables for MONGO_URI"
  });
};

