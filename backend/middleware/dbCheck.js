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
        name: error.name,
        code: error.code,
        hasMONGO_URI: !!process.env.MONGO_URI,
        mongoURILength: process.env.MONGO_URI?.length || 0,
        state: mongoose.connection.readyState
      });
      
      // Determine the specific issue
      let hint = "Unknown error";
      if (!process.env.MONGO_URI) {
        hint = "MONGO_URI environment variable is missing. Add it in Vercel dashboard → Settings → Environment Variables";
      } else if (error.name === "MongoServerSelectionError" || error.code === "ENOTFOUND") {
        hint = "Cannot reach MongoDB server. Check: 1) MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for Vercel), 2) Connection string format";
      } else if (error.name === "MongoAuthenticationError") {
        hint = "MongoDB authentication failed. Check username/password in connection string";
      } else if (error.message?.includes("timeout")) {
        hint = "Connection timeout. MongoDB server may be unreachable or IP not whitelisted";
      } else {
        hint = `Connection failed: ${error.message}. Check Vercel logs for details.`;
      }
      
      // Return detailed error for debugging
      return res.status(503).json({ 
        message: "Database connection failed. Please check server configuration.",
        error: error.message || "Database not connected",
        errorName: error.name,
        errorCode: error.code,
        state: mongoose.connection.readyState,
        hint: hint,
        troubleshooting: "Visit /api/test-db endpoint for detailed diagnostics"
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

