import React from "react";
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
  return (
    <div className="min-h-screen w-full app-shell flex flex-col">
      <div className="w-full border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
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
            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Get Started
          </motion.button>
        </div>
      </div>

      <main className="grid w-full flex-1 grid-cols-1 items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-12">
        <div className="flex flex-col justify-center rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-md backdrop-blur-md md:p-10">
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
            {fullText}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Start Your Journey
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl border border-slate-200/80 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
          className="relative flex min-h-[24rem] items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 p-3 shadow-md sm:min-h-[34rem]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/80 shadow-md">
            <img
              src="/map.png"
              alt="Tourist Safety"
              className="h-[22rem] w-full object-cover sm:h-[30rem]"
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
      </main>
    </div>
  );
}

export default Home;
