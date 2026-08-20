import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaLifeRing, FaUserCircle } from "react-icons/fa";
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
      <div className="min-h-screen w-full flex flex-col app-shell text-slate-900 pb-28 md:pb-0 md:overflow-hidden">
        <div className="hidden md:block sticky top-0 z-50 border-b border-white/15 bg-[#04617B] text-white shadow-sm backdrop-blur-md">
          <div className="w-full px-6 py-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-teal-200">
                Safe Travel
              </div>
              <div className="text-xl font-bold text-white">
                Globe Guard
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-teal-100/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Live monitoring</span>
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                <span>AI assisted</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SafetyAlertIndicator />
              <button
                type="button"
                onClick={() => navigate("/emergency")}
                title="Emergency Helper"
                className="flex items-center gap-2 rounded-full border border-rose-200/40 bg-rose-500/90 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                <FaLifeRing />
                <span>Emergency</span>
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/25"
              >
                Admin Dashboard
              </button>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex cursor-pointer flex-col items-center text-white transition hover:text-teal-200"
                onClick={() => navigate("/profile")}
              >
                <FaUserCircle className="text-3xl" />
                <span className="mt-1 text-xs">Profile</span>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="md:hidden border-b border-white/15 bg-[#04617B] px-4 py-3 text-white shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-teal-200">Safe Travel</div>
              <div className="text-xl font-bold text-white">Globe Guard</div>
            </div>
            <SafetyAlertIndicator />
          </div>
        </div>

        <div className="flex flex-1 min-h-0 px-4 py-4 md:px-6 md:py-5">
          <div className="dashboard-grid grid w-full grid-cols-1 gap-4 md:grid-cols-12 md:h-[calc(100vh-5rem)] md:gap-6">
              <div className="min-w-0 h-full overflow-hidden md:col-span-7">
                <LeftPanel
                  setStartLocation={setStartLocation}
                  setCurrentLocation={setCurrentLocation}
                  currentLocation={currentLocation}
                />
              </div>

              <div className="dashboard-right min-w-0 h-full min-h-0 md:col-span-5">
                <SmartSafetyAlerts />
                <div className="hidden lg:block">
                  <Chatbot compact />
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