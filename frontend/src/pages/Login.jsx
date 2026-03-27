import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaShieldAlt } from "react-icons/fa";

function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    const endpoint = isSignUp ? "/signup" : "/login";

    try {
      console.log(
        `Attempting ${isSignUp ? "signup" : "login"} with email: ${email}`
      );
      console.log(`API URL: ${API_BASE_URL}${endpoint}`);

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      console.log("Response:", { status: res.status, data });

      if (res.ok) {
        if (isSignUp) {
          setSuccess(data.message || "Signup successful! Please login.");
          setIsSignUp(false);
          setEmail("");
          setPassword("");
          setLoading(false);
        } else {
          setSuccess(data.message || "Login successful!");

          if (data.token) {
            localStorage.setItem("token", data.token);
            console.log("Token saved:", data.token);
          }

          localStorage.setItem("email", email.trim());
          console.log("Email saved:", email);

          setLoading(false);

          setTimeout(() => {
            navigate("/dashboard");
          }, 800);
        }
      } else {
        setError(data.error || "Authentication failed");
        setLoading(false);
        console.error("Auth error response:", data);
      }
    } catch (err) {
      setError(err.message || "Network or server error. Please try again.");
      setLoading(false);
      console.error("Full error:", err);
    }
  };

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-6 py-10">
      <div className="relative w-full max-w-4xl grid md:grid-cols-[1.1fr_0.9fr] overflow-hidden rounded-3xl shadow-2xl section-card">
        <motion.div
          className="p-8 md:p-10 flex flex-col justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Safe Travel
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {isSignUp
                ? "Join to unlock live safety alerts and secure travel tools."
                : "Sign in to access your safety dashboard."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/80 px-4 py-3">
              <FaEnvelope className="text-emerald-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-transparent outline-none text-sm"
                required
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/80 px-4 py-3">
              <FaLock className="text-emerald-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent outline-none text-sm"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className={`py-3 rounded-xl font-semibold text-white shadow-lg ${
                loading ? "bg-slate-400" : "btn-accent"
              }`}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
            </motion.button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-lg text-center font-semibold bg-rose-500 text-white shadow-lg"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-lg text-center font-semibold bg-emerald-500 text-white shadow-lg"
            >
              ✅ {success}
            </motion.div>
          )}

          <div className="text-sm text-slate-600">
            {isSignUp ? (
              <button
                type="button"
                className="font-semibold text-emerald-600"
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                  setSuccess("");
                }}
              >
                Already have an account? Sign In
              </button>
            ) : (
              <button
                type="button"
                className="font-semibold text-emerald-600"
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                  setSuccess("");
                }}
              >
                New here? Create an Account
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-white/70">
            <FaShieldAlt className="text-xl" />
            Traveler Shield
          </div>
          <div>
            <h3 className="text-3xl font-bold mb-3">
              {isSignUp ? "Step into safer travel" : "Stay protected"}
            </h3>
            <p className="text-sm text-white/90">
              Get live alerts, verified contacts, and directions to safe spots.
            </p>
          </div>
          <div className="text-xs text-white/80">AI powered · Always on guard</div>
        </motion.div>
      </div>
    </div>
  );
}

export default Auth;