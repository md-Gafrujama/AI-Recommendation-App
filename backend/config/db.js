import mongoose from "mongoose";

let isConnecting = false;

export const connectDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If already connecting, wait for it
  if (isConnecting) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once("connected", () => resolve(mongoose.connection));
      mongoose.connection.once("error", reject);
    });
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    isConnecting = true;
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    isConnecting = false;
    console.log("✅ MongoDB connected");
    return mongoose.connection;
  } catch (error) {
    isConnecting = false;
    console.error("❌ DB connection failed:", error.message);
    // Only exit in development, let Vercel retry in production
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw error; // Re-throw so caller can handle it
  }
};