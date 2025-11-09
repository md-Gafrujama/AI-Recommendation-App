import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import authRoutes from "../routes/authRoutes.js";
import recommendationRoutes from "../routes/recommendationRoutes.js";
import productRoutes from "../routes/productRoutes.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent folder (backend/.env)
dotenv.config({ path: path.join(__dirname, "../.env") });

// Connect to MongoDB
connectDB();

const app = express();

// -------------------- CORS --------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow localhost and all vercel.app domains
  if (origin && (origin.includes('localhost') || origin.endsWith('.vercel.app'))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

// -------------------- Middleware --------------------
app.use(express.json());
app.use(morgan("dev"));

// -------------------- Routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server running fine ✅" });
});

// -------------------- Local + Vercel Compatibility --------------------
// Locally: start express server manually
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// On Vercel: export app so Vercel can handle requests
export default app;
