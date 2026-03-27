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
import { SafetyAlertsProvider } from "../context/SafetyAlertsContext";

const libraries = ["places"];

function Dashboard() {
  const navigate = useNavigate();
  const [showChatbot, setShowChatbot] = useState(false);

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
      <div className="min-h-screen flex flex-col app-shell text-slate-900">
        <div className="hidden md:flex items-center justify-between px-6 py-4 app-header text-white sticky top-0 z-50">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/70">
              Safe Travel
            </div>
            <div className="text-2xl md:text-3xl font-extrabold tracking-wide drop-shadow">
              Smart Tourist Safety
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SafetyAlertIndicator />
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

        <div className="md:hidden px-6 pt-6">
          <div className="app-header rounded-2xl px-4 py-3 text-white flex items-center justify-between shadow-lg">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">Safe Travel</div>
              <div className="text-lg font-bold">Smart Safety</div>
            </div>
            <SafetyAlertIndicator />
          </div>
        </div>

        <div className="flex flex-1 px-6 py-8 pb-28 md:pb-8">
          <div className="w-full grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
            <LeftPanel
              setStartLocation={setStartLocation}
              setCurrentLocation={setCurrentLocation}
              currentLocation={currentLocation}
            />

            <div className="flex flex-col gap-6">
              <TripPlanner tripPlan={tripPlan} setTripPlan={setTripPlan} />
              <div className="hidden lg:block">
                <Chatbot />
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
            <div className="w-full max-h-[85vh] rounded-t-3xl section-card p-4 overflow-y-auto">
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
      </div>
    </SafetyAlertsProvider>
  );
}

export default Dashboard;