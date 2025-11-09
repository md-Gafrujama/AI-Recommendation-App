import User from "../models/User.js";
import jwt from "jsonwebtoken";

// ---------------------- REGISTER ----------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // FIXED: use instance + save so the pre-save hook runs and password is hashed
    const user = new User({ name, email, password });
    await user.save();

    return res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("❌ Registration error:", err.stack || err);
    return res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// ---------------------- LOGIN ----------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET in environment variables!");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("❌ Login error:", err.stack || err);
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
};
