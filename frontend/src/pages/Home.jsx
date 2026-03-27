import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaShieldAlt, FaMapMarkedAlt, FaBell } from "react-icons/fa";

function Home() {
  const navigate = useNavigate();

  const fullText =
    "Your travel companion that ensures safety, guides you through secure paths.";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index += 1;
      if (index === fullText.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen app-shell flex flex-col">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white shadow-lg">
            <FaShieldAlt />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Safe Travel
            </p>
            <h1 className="text-lg font-bold text-slate-900">Globe Guard</h1>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/login")}
          className="btn-accent px-5 py-2 text-sm font-semibold"
        >
          Get Started
        </motion.button>
      </div>

      <div className="flex-1 grid md:grid-cols-[1.1fr_0.9fr] gap-10 px-6 pb-12 pt-6">
        <div className="flex flex-col justify-center">
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Smart Tourist Safety
          </motion.h1>
          <p className="mt-4 text-lg text-slate-600 max-w-xl">
            {displayedText}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/login")}
              className="btn-primary px-6 py-3 text-sm font-semibold"
            >
              Start Your Journey
            </button>
            <button
              onClick={() => navigate("/login")}
              className="surface-muted px-6 py-3 text-sm font-semibold text-slate-700 rounded-xl"
            >
              Explore Features
            </button>
          </div>

          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="section-card p-4">
              <FaBell className="text-emerald-500 mb-2" />
              Live safety alerts
            </div>
            <div className="section-card p-4">
              <FaMapMarkedAlt className="text-sky-500 mb-2" />
              Direction guidance
            </div>
            <div className="section-card p-4">
              <FaShieldAlt className="text-amber-500 mb-2" />
              Verified contacts
            </div>
          </div>
        </div>

        <motion.div
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-6 rounded-3xl bg-gradient-to-br from-emerald-200/60 to-sky-200/50 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/60">
            <img
              src="/map.png"
              alt="Tourist Safety"
              className="w-full h-[420px] md:h-[520px] object-cover"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
