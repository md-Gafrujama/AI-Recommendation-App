import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    return mongoose.connection;
  } catch (error) {
    console.error("❌ DB connection failed:", error);
    // Only exit in development, let Vercel retry in production
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw error; // Re-throw so caller can handle it
  }
};