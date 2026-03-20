import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const endpoint = isSignUp ? "/signup" : "/login";

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (isSignUp) {
          // ✅ Signup flow
          setSuccess(data.message || "Signup successful! Please login.");
          setIsSignUp(false);
          setEmail("");
          setPassword("");
        } else {
          // ✅ Login flow
          setSuccess(data.message || "Login successful!");

          if (data.token) {
            localStorage.setItem("token", data.token); // Save JWT for later use
            console.log(data.token)
          }

          localStorage.setItem("email", email); // <-- Save email to localStorage after login
          console.log(email)

          setTimeout(() => {
            navigate("/dashboard"); // Redirect after success
          }, 800);
        }
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network or server error. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-skyblue-600">
      <div className="relative w-[800px] h-[500px] overflow-hidden rounded-2xl shadow-2xl flex">
        {/* Sign In / Sign Up form */}
        <motion.div
          className={`absolute top-0 h-full w-1/2 flex flex-col justify-center p-8 transition-all duration-700 ${
            isSignUp
              ? "left-[400px] bg-gradient-to-br from-blue-200 to-blue-400 text-black"
              : "left-0 bg-gradient-to-br from-blue-800 to-blue-600 text-white"
          }`}
          key={isSignUp ? "signup" : "signin"}
          initial={{ opacity: 0, x: isSignUp ? 100 : -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-center mb-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <motion.button
              type="submit"
              className="p-3 rounded-lg font-semibold bg-blue-700 text-white shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSignUp ? "Sign Up" : "Login"}
            </motion.button>
          </form>

          {/* 🚨 Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-3 rounded-lg text-center font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg"
            >
              ⚠️ {error}
            </motion.div>
          )}
          {/* ✅ Success Alert */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-3 rounded-lg text-center font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
            >
              ✅ {success}
            </motion.div>
          )}

          <div className="mt-6 text-center">
            {isSignUp ? (
              <button
                className="underline"
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
                className="underline"
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

        {/* Info Card */}
        <motion.div
          className={`absolute top-0 h-full w-1/2 flex flex-col justify-center items-center p-8 transition-all duration-700 ${
            isSignUp
              ? "left-0 bg-gradient-to-br from-indigo-500 to-blue-400 text-white"
              : "left-[400px] bg-gradient-to-br from-blue-900 to-indigo-700 text-white"
          }`}
          key={isSignUp ? "info-signup" : "info-signin"}
          initial={{ opacity: 0, x: isSignUp ? -100 : 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {isSignUp ? (
            <>
              <h2 className="text-3xl font-bold mb-4">Hello New Friend! 👋</h2>
              <p className="text-lg text-center">
                Want me to help with Tourist Safety? Join us and start your
                journey with a smart & safe travel experience.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-4">Hello Traveler 🌍</h2>
              <p className="text-lg text-center">
                Continue your journey with us! Sign in to stay safe and explore
                with confidence.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Auth;
