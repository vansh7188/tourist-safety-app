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
    <div className="min-h-screen w-full app-shell flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
      <div className="relative grid min-h-[min(760px,calc(100vh-4rem))] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-md backdrop-blur-md md:grid-cols-2">
        <motion.div
          className="flex flex-col justify-center gap-8 p-6 sm:p-10 lg:p-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Safe Travel
            </p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
              {isSignUp
                ? "Join to unlock live safety alerts and secure travel tools."
                : "Sign in to access your safety dashboard."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex max-w-xl flex-col gap-5">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
              <FaEnvelope className="text-lg text-emerald-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-transparent text-base outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
              <FaLock className="text-lg text-emerald-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent text-base outline-none"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className={`rounded-xl py-4 text-base font-semibold text-white shadow-sm ${
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
              className="rounded-xl bg-rose-500 p-4 text-center font-semibold text-white shadow-sm"
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
              className="rounded-xl bg-emerald-500 p-4 text-center font-semibold text-white shadow-sm"
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
          className="hidden flex-col justify-between bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-700 p-10 text-white md:flex lg:p-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-white/70">
            <FaShieldAlt className="text-xl" />
            Traveler Shield
          </div>
          <div>
            <h3 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
              {isSignUp ? "Step into safer travel" : "Stay protected"}
            </h3>
            <p className="max-w-md text-lg leading-relaxed text-white/90">
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