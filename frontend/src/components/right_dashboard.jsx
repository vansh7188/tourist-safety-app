// src/components/TripPlanner.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";

function TripPlanner() {
  const [showForm, setShowForm] = useState(false);
  const [locations, setLocations] = useState([{ name: "", suggestions: [] }]);
  const [plannedLocations, setPlannedLocations] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);

  // ✅ Load persisted trip plan from localStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem("tripPlan");
    if (savedPlan) {
      const parsed = JSON.parse(savedPlan);
      setPlannedLocations(parsed.plannedLocations || []);
      setMapMarkers(parsed.mapMarkers || []);
      setShowForm(false);
    }
  }, []);

  // ✅ Save trip plan whenever it changes
  useEffect(() => {
    if (plannedLocations.length > 0 || mapMarkers.length > 0) {
      localStorage.setItem(
        "tripPlan",
        JSON.stringify({ plannedLocations, mapMarkers })
      );
    }
  }, [plannedLocations, mapMarkers]);

  // Fetch suggestions (India-only)
  const fetchSuggestions = async (query, index) => {
    if (!query) {
      updateSuggestions(index, []);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      updateSuggestions(
        index,
        data.map((place) => ({
          display: place.display_name,
          lat: place.lat,
          lon: place.lon,
        }))
      );
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // Handle input change
  const handleChange = (index, value) => {
    const updated = [...locations];
    updated[index].name = value;
    setLocations(updated);
    fetchSuggestions(value, index);
  };

  // Update suggestions list
  const updateSuggestions = (index, suggestions) => {
    const updated = [...locations];
    updated[index].suggestions = suggestions;
    setLocations(updated);
  };

  // Select suggestion
  const handleSelectSuggestion = (index, suggestion) => {
    const updated = [...locations];
    updated[index].name = suggestion.display;
    updated[index].lat = suggestion.lat;
    updated[index].lon = suggestion.lon;
    updated[index].suggestions = [];
    setLocations(updated);
  };

  // Add new input
  const handleAddLocation = () => {
    setLocations([...locations, { name: "", suggestions: [] }]);
  };

  // Submit trip
  const handleSubmit = (e) => {
    e.preventDefault();
    const planned = locations
      .filter((loc) => loc.name && loc.lat && loc.lon)
      .map((loc) => ({
        name: loc.name,
        lat: parseFloat(loc.lat),
        lng: parseFloat(loc.lon),
      }));

    if (planned.length === 0) {
      alert("Please add at least one valid location!");
      return;
    }

    setPlannedLocations(planned);
    setMapMarkers(planned);
    setShowForm(false);

    // ✅ Save immediately after creating plan
    localStorage.setItem(
      "tripPlan",
      JSON.stringify({ plannedLocations: planned, mapMarkers: planned })
    );
  };

  // Clear trip
  const clearTrip = () => {
    setPlannedLocations([]);
    setMapMarkers([]);
    setLocations([{ name: "", suggestions: [] }]);
    setShowForm(false);
    localStorage.removeItem("tripPlan");
  };

  return (
    <motion.div
      className="flex-1 max-w-3xl mx-auto section-card p-6"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
    >
      <h2 className="section-title font-bold mb-3 text-lg flex items-center">
        🧳 Trip Planner
      </h2>

      {/* Show Form or Trip Planner UI */}
      {!showForm && plannedLocations.length === 0 ? (
        <>
          <p className="text-sm text-slate-600 mb-6">
            Organize your travel itinerary, add destinations, and plan safe
            routes.
          </p>

          <motion.div whileHover={{ scale: 1.05 }} className="flex justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 btn-accent hover:brightness-110 transition"
            >
              Plan Your Trip
            </button>
          </motion.div>
        </>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-md font-semibold text-slate-700 mb-2">
            ✍️ Enter Locations (India only)
          </h3>

          {locations.map((loc, index) => (
            <div key={index} className="relative">
              <input
                type="text"
                value={loc.name}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={`Location ${index + 1}`}
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring focus:ring-emerald-200 outline-none"
                required
              />
              {/* Suggestions Dropdown */}
              {loc.suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border rounded-lg shadow-md w-full mt-1 max-h-40 overflow-y-auto">
                  {loc.suggestions.map((sug, i) => (
                    <li
                      key={i}
                      onClick={() => handleSelectSuggestion(index, sug)}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                    >
                      {sug.display}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={handleAddLocation}
              className="px-4 py-2 btn-primary hover:brightness-110 transition"
            >
              + Add Location
            </button>
            <button
              type="submit"
              className="px-6 py-2 btn-accent hover:brightness-110 transition"
            >
              Save Trip
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 btn-muted hover:brightness-110 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Google Map */}
          {mapMarkers.length > 0 && (
            <div className="w-full h-150 rounded-lg overflow-hidden shadow-md border mt-4">
              <GoogleMap
                center={mapMarkers[0]}
                zoom={5}
                mapContainerStyle={{ width: "100%", height: "100%" }}
              >
                {mapMarkers.map((marker, i) => (
                  <Marker key={i} position={marker} />
                ))}

                {/* Polyline to connect locations */}
                <Polyline
                  path={mapMarkers}
                  options={{
                    strokeColor: "#FFB6C1",
                    strokeOpacity: 0.5,
                    strokeWeight: 4,
                    clickable: false,
                    draggable: false,
                    editable: false,
                    visible: true,
                    zIndex: 1,
                  }}
                />
              </GoogleMap>
            </div>
          )}

          {/* Trip Plan List */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg shadow border text-sm">
            <h3 className="font-bold text-blue-700 mb-2">📝 Your Trip Plan</h3>
            <ol className="list-decimal pl-5 space-y-1">
              {plannedLocations.map((loc, i) => (
                <li key={i}>{loc.name}</li>
              ))}
            </ol>
          </div>

          {/* Plan Another Trip + Clear Trip Buttons */}
          <div className="flex justify-center gap-3 mt-6">
            <motion.div whileHover={{ scale: 1.05 }}>
              <button
                onClick={() => {
                  setPlannedLocations([]);
                  setShowForm(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
              >
                Plan Another Trip
              </button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }}>
              <button
                onClick={clearTrip}
                className="px-6 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
              >
                Cancel Trip
              </button>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default TripPlanner;

