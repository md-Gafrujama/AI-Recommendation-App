import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/authAPI";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast"; // ✅ FIXED import
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ FIXED: send full object to registerUser
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // ✅ FIXED: also send object to login
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: form.email,
        password: form.password,
      });

      login(res.data);
      toast.success("Account created successfully 🎉");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="w-full max-w-md card">
        <h2 className="mb-6 text-2xl font-semibold text-center text-blue-600 dark:text-blue-400">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 text-gray-900 placeholder-gray-400 bg-white border rounded-lg outline-none dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 text-gray-900 placeholder-gray-400 bg-white border rounded-lg outline-none dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 text-gray-900 placeholder-gray-400 bg-white border rounded-lg outline-none dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-700 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
