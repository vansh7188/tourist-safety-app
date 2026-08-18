import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaShieldAlt, FaMapMarkedAlt, FaBell, FaRoute } from "react-icons/fa";

function Home() {
  const navigate = useNavigate();
  const featureCards = [
    {
      title: "Live Safety Alerts",
      description: "Receive local risk signals and stay informed while moving.",
      icon: <FaBell className="text-emerald-500" />,
      accent: "border-emerald-200",
    },
    {
      title: "Smart Route Guidance",
      description: "Get safer route suggestions designed for public transport.",
      icon: <FaRoute className="text-sky-500" />,
      accent: "border-sky-200",
    },
    {
      title: "Trusted Contacts",
      description: "Keep emergency contacts and profile details ready anytime.",
      icon: <FaShieldAlt className="text-amber-500" />,
      accent: "border-amber-200",
    },
  ];

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
    <div className="min-h-screen app-shell flex flex-col px-4 pb-10 sm:px-6">
      <div className="w-full max-w-7xl mx-auto pt-4 sm:pt-6">
        <div className="section-card px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
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
      </div>

      <div className="w-full max-w-7xl mx-auto flex-1 grid lg:grid-cols-[1.08fr_0.92fr] gap-6 lg:gap-8 pt-6 sm:pt-8">
        <div className="section-card premium-card p-6 md:p-8 lg:p-9 flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Real-time safety companion
          </div>
          <motion.h1
            className="mt-5 text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight"
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

          <div className="mt-10 grid sm:grid-cols-3 gap-3">
            {featureCards.map((item) => (
              <motion.div
                key={item.title}
                className={`feature-grid-card ${item.accent}`}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-2.5 mb-2 text-sm font-semibold text-slate-900">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="relative section-card accent-card p-3 sm:p-4 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-200/60 blur-3xl" />
          <div className="absolute -left-14 -bottom-14 h-40 w-40 rounded-full bg-sky-200/70 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/60 w-full">
            <img
              src="/map.png"
              alt="Tourist Safety"
              className="w-full h-[340px] sm:h-[420px] md:h-[520px] object-cover"
            />
            <div className="absolute left-4 bottom-4 right-4 rounded-2xl bg-slate-900/60 backdrop-blur px-4 py-3 text-white">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sky-200">
                <FaMapMarkedAlt />
                Safety View
              </div>
              <p className="mt-1 text-sm font-semibold">
                Map, alerts, SOS access, and route planning in one dashboard.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
