import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaPlane,
  FaShieldAlt,
  FaHotel,
  FaUserTie,
  FaBolt,
  FaDatabase,
  FaStar,
  FaMapSigns,
  FaExclamationTriangle,
  FaCheckCircle,
  FaRoute,
} from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";
import MobileNavBar from "../components/MobileNavBar";
import {
  buildAIPlan,
  triggerDisruption,
  bookGuide,
  getDataOverview,
} from "../services/travelGuardAPI";

const STORAGE_KEY = "aiTripPlan";

function AITripPlanner() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Form state
  const [destination, setDestination] = useState("Jaipur");
  const [days, setDays] = useState(3);
  const [travelerType, setTravelerType] = useState("solo");

  // Plan state
  const [plan, setPlan] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Data health state
  const [dataHealth, setDataHealth] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("itinerary");

  // Persist plan
  useEffect(() => {
    if (plan) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    }
  }, [plan]);

  // Load data health on mount
  useEffect(() => {
    getDataOverview()
      .then(setDataHealth)
      .catch(() => setDataHealth(null));
  }, []);

  const handleBuildPlan = async () => {
    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await buildAIPlan(destination.trim(), days, travelerType);
      setPlan(result);
      setMessage("Your AI-powered itinerary is ready!");
      setActiveTab("itinerary");
    } catch (err) {
      setError(err.message || "Failed to build plan. Is the AI server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleDisruption = async () => {
    if (!plan) return;
    const firstStop = plan.days[0]?.stops?.[0]?.original_name;
    if (!firstStop) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await triggerDisruption({
        destination: plan.destination,
        location: firstStop,
        days,
        travelerType,
        score: 20,
        message: "Emergency alert simulated for demo.",
      });
      setPlan(result.plan);
      setMessage(
        `⚡ Live alert added: ${result.alert.location} was flagged and rerouted safely.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookGuide = async (guideId, day) => {
    if (!plan) return;
    try {
      const result = await bookGuide(guideId, day, plan.destination);
      setMessage(`✅ Guide booked for Day ${day}: ${result.booking.booking_id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const dataHealthReady = dataHealth
    ? Object.values(dataHealth).filter((d) => d.loaded).length
    : 0;
  const dataHealthTotal = dataHealth ? Object.keys(dataHealth).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04617B]/5 via-white to-teal-50/40">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/20 bg-[#04617B] text-white shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium transition hover:bg-white/20"
            >
              <FaArrowLeft className="text-xs" />
              {t("backToDashboard") || "Back"}
            </button>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-200">
                AI / ML Engine
              </div>
              <div className="text-lg font-extrabold leading-tight">
                {t("tripPlanner") || "Trip Planner"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dataHealth && (
              <div
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  dataHealthReady === dataHealthTotal
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-amber-400/20 text-amber-200"
                }`}
              >
                <FaDatabase className="mr-1 inline text-[8px]" />
                {dataHealthReady}/{dataHealthTotal} datasets
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-teal-100/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Gemini + ML
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {/* Plan builder form */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-teal-100/60 bg-white/80 p-5 shadow-lg backdrop-blur-sm md:p-6"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600">
                01 / Your Trip
              </p>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
                Where are you headed?
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              ● Ready
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Destination
              </span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Jaipur, Delhi, Goa"
                className="rounded-xl border border-teal-200/50 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Number of days
              </span>
              <input
                type="number"
                value={days}
                min={1}
                max={14}
                onChange={(e) =>
                  setDays(Math.max(1, Math.min(14, Number(e.target.value))))
                }
                className="rounded-xl border border-teal-200/50 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Traveler type
              </span>
              <select
                value={travelerType}
                onChange={(e) => setTravelerType(e.target.value)}
                className="rounded-xl border border-teal-200/50 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="solo">Solo explorer</option>
                <option value="family">Family</option>
                <option value="budget">Budget traveler</option>
                <option value="adventure">Adventure seeker</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                onClick={handleBuildPlan}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:shadow-xl hover:brightness-105 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Building...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaPlane className="text-xs" />
                    Build my trip →
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.section>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
              <FaExclamationTriangle className="mr-2 inline" />
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
            >
              <FaCheckCircle className="mr-2 inline" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            {/* Plan header */}
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600">
                  02 / Your Plan
                </p>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
                  {plan.days.length}-day {plan.destination} escape
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                ✦ {plan.source}
              </span>
            </div>

            {/* Live demo banner */}
            <div className="mb-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-rose-200/60 bg-gradient-to-r from-rose-50 to-orange-50/60 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">
                  Live Demo
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  Watch the plan react to a safety alert
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  A new alert appears on a planned stop. The filter flags it and reroutes
                  that day.
                </p>
              </div>
              <button
                onClick={handleDisruption}
                disabled={loading}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:shadow-xl hover:brightness-105 disabled:opacity-60"
              >
                <FaBolt />
                Trigger safety alert
              </button>
            </div>

            {/* Tab navigation */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {[
                { id: "itinerary", label: "Itinerary", icon: FaMapSigns },
                { id: "recommendations", label: "ML Recommendations", icon: FaStar },
                { id: "route", label: "Expected Route", icon: FaRoute },
                { id: "hotels", label: "Hotels", icon: FaHotel },
                { id: "guides", label: "Guides", icon: FaUserTie },
                { id: "data", label: "Data Health", icon: FaDatabase },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === tab.id
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-white text-slate-500 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  <tab.icon className="text-[10px]" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "itinerary" && (
                <motion.div
                  key="itinerary"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="grid gap-3"
                >
                  {plan.days.map((day) => (
                    <div
                      key={day.day}
                      className="grid grid-cols-[80px_1fr] gap-4 rounded-2xl border border-teal-100/50 bg-white/70 p-4 shadow-sm backdrop-blur-sm md:grid-cols-[110px_1fr]"
                    >
                      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-500/80">
                        Day {String(day.day).padStart(2, "0")}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {day.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">
                          {day.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {day.stops.map((stop, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                                stop.rerouted
                                  ? "border-l-4 border-amber-400 bg-amber-50 text-amber-800"
                                  : stop.flagged
                                  ? "border-l-4 border-rose-400 bg-rose-50 text-rose-700"
                                  : "border-l-4 border-emerald-400 bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              ●{" "}{stop.name}
                              {stop.rerouted && (
                                <span className="ml-1 text-[9px] font-black uppercase tracking-wider text-amber-600">
                                  Rerouted
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                        {/* Safety details for each stop */}
                        <div className="mt-2 flex flex-wrap gap-3">
                          {day.stops.map((stop, i) => (
                            <div
                              key={i}
                              className="text-[10px] text-slate-400"
                            >
                              <span className="font-bold text-slate-500">
                                {stop.name}
                              </span>{" "}
                              — Safety: {stop.safety?.score ?? "N/A"}/100 (
                              {stop.safety?.level ?? "Unknown"})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "recommendations" && (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <div className="mb-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600">
                      03 / Machine Learning
                    </p>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                      All recommended places
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Every named place for your destination, highlighted and ranked
                      using ML signals trained from Travel Guard insights.
                    </p>
                  </div>
                  {plan.ml_recommendations?.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {plan.ml_recommendations.map((item, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border-2 border-rose-200/60 bg-gradient-to-br from-white to-rose-50/40 p-4 shadow-sm"
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-rose-500">
                            ★ Highlighted
                          </p>
                          <h4 className="mt-1 text-sm font-extrabold text-slate-900">
                            {item.place_name}
                          </h4>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {item.nearby_label ||
                              `Recommended near ${plan.destination}`}{" "}
                            · POI {item.poi_id}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Category {item.category_id} · Region{" "}
                            {item.geographic_id}
                          </p>
                          <p className="mt-2 text-sm font-extrabold text-teal-600">
                            {(item.recommendation_score * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Run the data pipeline to train recommendations.
                    </p>
                  )}

                  {/* ML Model info */}
                  {plan.ml_model && (
                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Model Info
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4">
                        <div>
                          <span className="font-bold">Model</span>
                          <br />
                          {plan.ml_model.model}
                        </div>
                        <div>
                          <span className="font-bold">Algorithm</span>
                          <br />
                          {plan.ml_model.algorithm}
                        </div>
                        <div>
                          <span className="font-bold">Training rows</span>
                          <br />
                          {plan.ml_model.training_rows?.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-bold">Catalog size</span>
                          <br />
                          {plan.ml_model.catalog_size?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "route" && (
                <motion.div
                  key="route"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="rounded-2xl border border-teal-100/50 bg-white/70 p-5 shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600">
                        Expected Route
                      </p>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                        The tourist's planned route
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        This route is the baseline for detecting when a live
                        traveler goes significantly off-plan.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Ready for live tracking
                    </span>
                  </div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {plan.expected_route?.map((route) => (
                      <div
                        key={route.day}
                        className="flex items-center gap-5 py-3"
                      >
                        <span className="text-xs font-black uppercase tracking-wider text-rose-500">
                          Day {route.day}
                        </span>
                        <span className="text-sm text-slate-600">
                          {route.locations.join(" → ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "hotels" && (
                <motion.div
                  key="hotels"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="rounded-2xl border border-teal-100/50 bg-white/70 p-5 shadow-sm backdrop-blur-sm"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600">
                    Stay Near Every Stop
                  </p>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Trusted hotels
                  </h2>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      "hotels in " + plan.destination
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-200/50 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-teal-800 no-underline transition hover:bg-emerald-100"
                  >
                    Browse hotels in {plan.destination} ↗
                  </a>

                  {plan.hotels?.length > 0 ? (
                    <div className="mt-4 divide-y divide-slate-100">
                      {plan.hotels.map((hotel, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {hotel.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Near {hotel.place || plan.destination} ·{" "}
                              {hotel.amenities} · {hotel.price}
                            </p>
                          </div>
                          <span className="text-sm font-black text-amber-600">
                            ★ {hotel.trust_score}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">
                      No local hotel picks yet. Browse current options for this
                      location.
                    </p>
                  )}
                </motion.div>
              )}

              {activeTab === "guides" && (
                <motion.div
                  key="guides"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="rounded-2xl border border-teal-100/50 bg-white/70 p-5 shadow-sm backdrop-blur-sm"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600">
                    Local Experts
                  </p>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Book a verified guide
                  </h2>
                  {plan.guides?.length > 0 ? (
                    <div className="mt-4 divide-y divide-slate-100">
                      {plan.guides.map((guide, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {guide.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {guide.specialty} · {guide.languages}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              id={`guide-day-${guide.id}`}
                              className="rounded-lg border border-teal-200/60 bg-white px-2 py-1.5 text-xs text-slate-600 outline-none"
                            >
                              {plan.days.map((d) => (
                                <option key={d.day} value={d.day}>
                                  Day {d.day}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const sel = document.getElementById(
                                  `guide-day-${guide.id}`
                                );
                                handleBookGuide(guide.id, sel?.value || "1");
                              }}
                              className="rounded-lg bg-teal-600 px-3 py-1.5 text-[10px] font-bold uppercase text-white shadow transition hover:bg-teal-700"
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">
                      No verified guides for this destination yet.
                    </p>
                  )}
                </motion.div>
              )}

              {activeTab === "data" && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="rounded-2xl border border-teal-100/50 bg-white/70 p-5 shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600">
                        Data Foundation
                      </p>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                        All datasets connected
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        These files power the recommendation and itinerary
                        filtering pipeline.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        dataHealthReady === dataHealthTotal
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      ● {dataHealthReady}/{dataHealthTotal} loaded
                    </span>
                  </div>
                  {dataHealth ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(dataHealth).map(([name, info]) => (
                        <div
                          key={name}
                          className={`rounded-xl border p-4 ${
                            info.loaded
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-rose-200 bg-rose-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800">
                              {name}
                            </p>
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider ${
                                info.loaded
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {info.loaded ? "● Loaded" : "○ Missing"}
                            </span>
                          </div>
                          <p className="mt-2 text-[11px] text-slate-500">
                            {info.rows} rows · {info.used_for}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">
                      Data API unavailable — is the AI server running?
                    </p>
                  )}

                  {/* Filtering status */}
                  {plan.filtering && (
                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Pipeline Status
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {Object.entries(plan.filtering).map(
                          ([key, value]) => (
                            <span
                              key={key}
                              className={`rounded-lg px-3 py-1 text-[10px] font-bold ${
                                value
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {value ? "✓" : "✗"}{" "}
                              {key.replace(/_/g, " ")}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <MobileNavBar
        active="plan-trip"
        onChat={() => navigate("/chatbot")}
        onNavigate={navigate}
      />
    </div>
  );
}

export default AITripPlanner;
