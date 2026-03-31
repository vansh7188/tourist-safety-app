// src/components/LeftPanel.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MapComponent from "./MapComponent";
import PanicButton from "./PanicButton";

function LeftPanel({ setStartLocation, setCurrentLocation, currentLocation }) {
  // Load persisted showMap from localStorage
  const [showMap, setShowMap] = useState(() => {
    return JSON.parse(localStorage.getItem("showMap")) || false;
  });

  // Save whenever showMap changes
  useEffect(() => {
    localStorage.setItem("showMap", JSON.stringify(showMap));
  }, [showMap]);

  console.log(currentLocation)
  return (
    <motion.div
      className="flex-1 max-w-4xl mx-auto section-card p-5 md:p-7"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title font-bold text-xl flex items-center gap-2">
            <span>🗺️</span>
            <span>Your Live Safety Map</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Track your current position and trigger emergency assistance instantly.
          </p>
        </div>
      </div>

      {/* Map Section */}
      <div className="w-full h-[26rem] md:h-[32rem] rounded-2xl overflow-hidden shadow-inner border border-white/70">
        {showMap ? (
          <MapComponent
            setStartLocation={setStartLocation}
            setCurrentLocation={setCurrentLocation}
          />
        ) : (
          <img
            src="/map.png"
            alt="Map"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Start Live Tracking Button */}
      {!showMap && (
        <motion.div
          className="flex justify-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowMap(true)}
            className="px-6 py-2 btn-primary hover:brightness-110 transition"
          >
            Start Live Tracking
          </button>
        </motion.div>
      )}

      {/* Panic Button */}
      {/* Panic Button */}
      <motion.div
        className="flex justify-center mt-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        <PanicButton currentLocation={currentLocation} />
      </motion.div>


      {/* Location Details */}
      {currentLocation && (
        <div className="mt-6 p-4 md:p-5 surface-muted rounded-2xl shadow text-sm">
          <h3 className="font-bold text-slate-800 mb-3 text-base">📍 Current Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p><strong>Address:</strong> {currentLocation.displayName}</p>
            <p><strong>City:</strong> {currentLocation.city}</p>
            <p><strong>District:</strong> {currentLocation.district}</p>
            <p><strong>State:</strong> {currentLocation.state}</p>
            <p><strong>Postal Code:</strong> {currentLocation.postcode}</p>
            <p><strong>Type:</strong> {currentLocation.type}</p>
          </div>


        </div>
      )}
    </motion.div>
  );
}

export default LeftPanel;
