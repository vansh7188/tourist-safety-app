import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";
import MobileNavBar from "../components/MobileNavBar";
import { useJsApiLoader } from "@react-google-maps/api";
import LeftPanel from "../components/left_dashboard";
import TripPlanner from "../components/right_dashboard";
import Chatbot from "../components/Chatbot";
import SafetyAlertIndicator from "../components/SafetyAlertIndicator";
import SmartSafetyAlerts from "../components/SmartSafetyAlerts";
import { SafetyAlertsProvider } from "../context/SafetyAlertsContext";

const libraries = ["places"];

function Dashboard() {
  const navigate = useNavigate();
  const [showChatbot, setShowChatbot] = useState(false);
  const [showTripPlanner, setShowTripPlanner] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [startLocation, setStartLocation] = useState(
    () => JSON.parse(localStorage.getItem("startLocation")) || null
  );
  const [currentLocation, setCurrentLocation] = useState(
    () => JSON.parse(localStorage.getItem("currentLocation")) || null
  );
  const [tripPlan, setTripPlan] = useState(
    () => JSON.parse(localStorage.getItem("tripPlan")) || []
  );

  // Auth check - redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found. Redirecting to login.");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("startLocation", JSON.stringify(startLocation));
  }, [startLocation]);

  useEffect(() => {
    localStorage.setItem("currentLocation", JSON.stringify(currentLocation));
  }, [currentLocation]);

  useEffect(() => {
    localStorage.setItem("tripPlan", JSON.stringify(tripPlan));
  }, [tripPlan]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Map...
      </div>
    );
  }

  return (
    <SafetyAlertsProvider>
      <div className="min-h-screen md:h-screen flex flex-col app-shell text-slate-900 px-4 md:px-6 pb-28 md:pb-5 md:overflow-hidden">
        <div className="hidden md:block sticky top-3 z-50 pt-3">
          <div className="max-w-7xl mx-auto app-header text-white rounded-2xl px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                Safe Travel
              </div>
              <div className="text-2xl md:text-3xl font-extrabold tracking-wide drop-shadow">
                Smart Tourist Safety
              </div>
              <div className="mt-2 flex items-center gap-2 text-white/90">
                <span className="soft-chip">Live Monitoring</span>
                <span className="soft-chip">AI Assisted</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SafetyAlertIndicator />
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                Admin Dashboard
              </button>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                <FaUserCircle className="text-4xl" />
                <span className="text-xs mt-1">Profile</span>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="md:hidden pt-4">
          <div className="app-header rounded-2xl px-4 py-3 text-white flex items-center justify-between shadow-lg">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">Safe Travel</div>
              <div className="text-lg font-bold">Smart Safety</div>
            </div>
            <SafetyAlertIndicator />
          </div>
        </div>

        <div className="flex flex-1 py-5 md:py-4 min-h-0">
          <div className="dashboard-grid w-full flex flex-col gap-4 min-h-0">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="dashboard-highlight">
                <div className="text-xs uppercase tracking-[0.15em] text-emerald-700 font-bold">Protection</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Instant SOS + live location</div>
              </div>
              <div className="dashboard-highlight">
                <div className="text-xs uppercase tracking-[0.15em] text-sky-700 font-bold">Planning</div>
                <div className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                  <span>Compare Metro, Bus, and Train routes</span>
                  <button
                    type="button"
                    onClick={() => setShowTripPlanner(true)}
                    className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-sky-700"
                  >
                    Open
                  </button>
                </div>
              </div>
              <div className="dashboard-highlight">
                <div className="text-xs uppercase tracking-[0.15em] text-amber-700 font-bold">Awareness</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Smart area alerts with risk score</div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-[1.16fr_0.84fr] gap-4 items-stretch min-h-0 md:h-[calc(100vh-230px)]">
              <div className="min-w-0 h-full overflow-hidden">
                <LeftPanel
                  setStartLocation={setStartLocation}
                  setCurrentLocation={setCurrentLocation}
                  currentLocation={currentLocation}
                />
              </div>

              <div className="dashboard-right min-w-0 h-full min-h-0">
                <SmartSafetyAlerts />
                <div className="hidden lg:block">
                  <Chatbot compact />
                </div>
              </div>
            </div>
          </div>
        </div>

        <MobileNavBar
          active="dashboard"
          onChat={() => setShowChatbot(true)}
          onNavigate={navigate}
        />

        {showChatbot && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
            <div className="w-full max-h-[88vh] rounded-t-3xl section-card p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-700">AI Safety Chatbot</div>
                <button
                  type="button"
                  onClick={() => setShowChatbot(false)}
                  className="text-xs font-semibold text-slate-500"
                >
                  Close
                </button>
              </div>
              <Chatbot />
            </div>
          </div>
        )}

        {showTripPlanner && (
          <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[1px] flex items-center justify-center px-4">
            <div className="w-full max-w-5xl max-h-[90vh] section-card premium-card p-4 md:p-5 overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Planning</div>
                  <div className="text-base md:text-lg font-extrabold text-slate-900">Trip Planner</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTripPlanner(false)}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
              <TripPlanner tripPlan={tripPlan} setTripPlan={setTripPlan} />
            </div>
          </div>
        )}
      </div>
    </SafetyAlertsProvider>
  );
}

export default Dashboard;