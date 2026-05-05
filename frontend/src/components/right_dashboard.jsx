// src/components/TripPlanner.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DirectionsRenderer, GoogleMap, Marker } from "@react-google-maps/api";

function TripPlanner() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [showForm, setShowForm] = useState(false);
  const [locations, setLocations] = useState([{ name: "", suggestions: [] }]);
  const [plannedLocations, setPlannedLocations] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [transportPlans, setTransportPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState("");
  const [planReady, setPlanReady] = useState(false);
  const alertCacheRef = useRef(new Map());
  const suggestionRequestRef = useRef(0);

  const serializePlansForStorage = (plans = []) => {
    return plans.map(({ directionsResult, ...rest }) => rest);
  };

  // ✅ Load persisted trip plan from localStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem("tripPlan");
    if (savedPlan) {
      const parsed = JSON.parse(savedPlan);
      setPlannedLocations(parsed.plannedLocations || []);
      setMapMarkers(parsed.mapMarkers || []);
      setTransportPlans(parsed.transportPlans || []);
      setSelectedPlanId(parsed.selectedPlanId || "");
      setPlanReady(Boolean((parsed.transportPlans || []).length));
      setShowForm(false);
    }
  }, []);

  // ✅ Save trip plan whenever it changes
  useEffect(() => {
    if (
      plannedLocations.length > 0 ||
      mapMarkers.length > 0 ||
      transportPlans.length > 0
    ) {
      localStorage.setItem(
        "tripPlan",
        JSON.stringify({
          plannedLocations,
          mapMarkers,
          transportPlans: serializePlansForStorage(transportPlans),
          selectedPlanId,
        })
      );
    }
  }, [plannedLocations, mapMarkers, selectedPlanId, transportPlans]);

  const selectedPlan = useMemo(
    () => transportPlans.find((plan) => plan.id === selectedPlanId) || transportPlans[0] || null,
    [selectedPlanId, transportPlans]
  );

  const recommendedPlan = useMemo(() => {
    if (transportPlans.length === 0) return null;
    return [...transportPlans].sort((a, b) => a.score - b.score)[0];
  }, [transportPlans]);

  // Fetch suggestions (India-only)
  const fetchSuggestions = async (query, index) => {
    if (!query) {
      updateSuggestions(index, []);
      return;
    }

    const requestId = ++suggestionRequestRef.current;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&limit=6&q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();

      // Ignore stale async responses from older queries.
      if (requestId !== suggestionRequestRef.current) return;

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
    setLocations((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: value,
        // Reset resolved coordinates if user edits text after selection.
        lat: undefined,
        lon: undefined,
      };
      return updated;
    });
    fetchSuggestions(value, index);
  };

  // Update suggestions list
  const updateSuggestions = (index, suggestions) => {
    setLocations((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], suggestions };
      return updated;
    });
  };

  // Select suggestion
  const handleSelectSuggestion = (index, suggestion) => {
    setLocations((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = {
        ...updated[index],
        name: suggestion.display,
        lat: suggestion.lat,
        lon: suggestion.lon,
        suggestions: [],
      };
      return updated;
    });
  };

  // Add new input
  const handleAddLocation = () => {
    setLocations([...locations, { name: "", suggestions: [] }]);
  };

  const handleRemoveLocationInput = (index) => {
    setLocations((prev) => {
      if (prev.length <= 1) {
        return [{ name: "", suggestions: [] }];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemovePlannedStop = (index) => {
    setPlannedLocations((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setMapMarkers(next);
      setTransportPlans([]);
      setSelectedPlanId("");
      setPlanReady(false);
      setCalculationError("");

      if (next.length === 0) {
        localStorage.removeItem("tripPlan");
      } else {
        localStorage.setItem(
          "tripPlan",
          JSON.stringify({
            plannedLocations: next,
            mapMarkers: next,
            transportPlans: [],
            selectedPlanId: "",
          })
        );
      }
      return next;
    });
  };

  const resolveLocationFromText = async (name) => {
    try {
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode(
            {
              address: name,
              componentRestrictions: { country: "IN" },
            },
            (results, status) => {
              if (status === "OK" && results?.[0]) {
                resolve(results[0]);
              } else {
                reject(new Error(`Geocoder failed: ${status}`));
              }
            }
          );
        });

        const point = result.geometry?.location;
        if (point) {
          return {
            name: result.formatted_address || name,
            lat: point.lat(),
            lng: point.lng(),
          };
        }
      }
    } catch (err) {
      console.warn("Google geocode failed, falling back to OSM:", err.message);
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(
        name
      )}`
    );
    const data = await res.json().catch(() => []);
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) return null;

    return {
      name: first.display_name || name,
      lat: Number(first.lat),
      lng: Number(first.lon),
    };
  };

  // Submit trip
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCalculationError("");

    const planned = [];

    for (const loc of locations) {
      const typedName = String(loc?.name || "").trim();
      if (!typedName) continue;

      if (loc.lat && loc.lon) {
        planned.push({
          name: typedName,
          lat: parseFloat(loc.lat),
          lng: parseFloat(loc.lon),
        });
        continue;
      }

      const resolved = await resolveLocationFromText(typedName);
      if (resolved) {
        planned.push(resolved);
      }
    }

    if (planned.length < 2) {
      alert("Please add at least 2 valid locations (for example: India Gate, CP, Home).");
      return;
    }

    setPlannedLocations(planned);
    setMapMarkers(planned);
    setShowForm(false);
    setPlanReady(false);
    setTransportPlans([]);
    setSelectedPlanId("");

    localStorage.setItem(
      "tripPlan",
      JSON.stringify({
        plannedLocations: planned,
        mapMarkers: planned,
        transportPlans: [],
        selectedPlanId: "",
      })
    );
  };

  const getDirections = (request) => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.DirectionsService) {
        reject(new Error("Google Maps not loaded"));
        return;
      }

      const service = new window.google.maps.DirectionsService();
      service.route(request, (result, status) => {
        if (status === "OK" && result) {
          resolve(result);
        } else {
          reject(new Error(`Directions failed: ${status}`));
        }
      });
    });
  };

  const getAlertRiskForPoint = async (lat, lng) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (alertCacheRef.current.has(key)) {
      return alertCacheRef.current.get(key);
    }

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radiusKm: "0.8",
      });

      const res = await fetch(`${API_BASE_URL}/api/alerts?${params}`);
      const data = await res.json().catch(() => ({}));
      const alerts = Array.isArray(data.alerts) ? data.alerts : [];

      const risk = alerts.reduce((sum, item) => {
        if (item.type === "danger") return sum + 3;
        if (item.type === "low_network") return sum + 2;
        return sum + 1;
      }, 0);

      const payload = { risk, alertsCount: alerts.length };
      alertCacheRef.current.set(key, payload);
      return payload;
    } catch {
      const payload = { risk: 0, alertsCount: 0 };
      alertCacheRef.current.set(key, payload);
      return payload;
    }
  };

  const summarizeTransit = async (directionsResult) => {
    const route = directionsResult?.routes?.[0];
    if (!route?.legs?.length) {
      return null;
    }

    let totalDistanceMeters = 0;
    let totalDurationSeconds = 0;
    let totalRisk = 0;
    let alertHits = 0;
    let transfers = 0;
    const vehicleTypes = new Set();
    const checkedPoints = [];

    route.legs.forEach((leg) => {
      totalDistanceMeters += leg.distance?.value || 0;
      totalDurationSeconds += leg.duration?.value || 0;

      if (leg.start_location) {
        checkedPoints.push({ lat: leg.start_location.lat(), lng: leg.start_location.lng() });
      }
      if (leg.end_location) {
        checkedPoints.push({ lat: leg.end_location.lat(), lng: leg.end_location.lng() });
      }

      (leg.steps || []).forEach((step) => {
        if (step.travel_mode === "TRANSIT" && step.transit) {
          transfers += 1;
          const vehicle = step.transit.line?.vehicle?.type || "TRANSIT";
          vehicleTypes.add(vehicle);
        }
      });
    });

    for (const point of checkedPoints) {
      const riskResult = await getAlertRiskForPoint(point.lat, point.lng);
      totalRisk += riskResult.risk;
      alertHits += riskResult.alertsCount;
    }

    const durationMin = Math.round(totalDurationSeconds / 60);
    const distanceKm = Number((totalDistanceMeters / 1000).toFixed(1));
    const normalizedRisk = checkedPoints.length > 0 ? totalRisk / checkedPoints.length : 0;
    const safetyScore = Math.max(1, Number((5 - normalizedRisk).toFixed(1)));

    return {
      durationMin,
      distanceKm,
      safetyScore,
      alertsAlongRoute: alertHits,
      transfers: Math.max(0, transfers - 1),
      vehicles: Array.from(vehicleTypes),
    };
  };

  const buildRequest = (planned, transitModes) => {
    const origin = planned[0];
    const destination = planned[planned.length - 1];
    const waypoints = planned.slice(1, -1).map((loc) => ({
      location: { lat: loc.lat, lng: loc.lng },
      stopover: true,
    }));

    const request = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints,
      optimizeWaypoints: false,
      travelMode: window.google.maps.TravelMode.TRANSIT,
      provideRouteAlternatives: false,
    };

    if (transitModes?.length) {
      request.transitOptions = {
        modes: transitModes,
      };
    }

    return request;
  };

  const calculatePlans = async (planned = plannedLocations) => {
    if (!planned || planned.length < 2) {
      setCalculationError("Please add at least 2 places to calculate a route.");
      return;
    }

    setIsCalculating(true);
    setCalculationError("");

    const modeConfigs = [
      {
        id: "metro",
        label: "Metro / Subway",
        note: "Best for speed and predictable timing in cities",
        transitModes: [window.google.maps.TransitMode.SUBWAY, window.google.maps.TransitMode.RAIL],
      },
      {
        id: "bus",
        label: "Bus",
        note: "Wide coverage and usually low-cost",
        transitModes: [window.google.maps.TransitMode.BUS],
      },
      {
        id: "train",
        label: "Train / Rail",
        note: "Suitable for longer distance sections",
        transitModes: [window.google.maps.TransitMode.TRAIN, window.google.maps.TransitMode.RAIL],
      },
      {
        id: "mixed",
        label: "Mixed Public Transport",
        note: "Lets Google combine public transport options",
        transitModes: [],
      },
    ];

    try {
      const results = [];

      for (const cfg of modeConfigs) {
        try {
          const request = buildRequest(planned, cfg.transitModes);
          const directionsResult = await getDirections(request);
          const summary = await summarizeTransit(directionsResult);

          if (!summary) continue;

          const score =
            summary.durationMin +
            (5 - summary.safetyScore) * 8 +
            summary.transfers * 3 +
            summary.alertsAlongRoute * 1.2;

          results.push({
            ...cfg,
            ...summary,
            score,
            directionsResult,
          });
        } catch (err) {
          console.warn(`Could not build ${cfg.id} plan:`, err.message);
        }
      }

      if (results.length === 0) {
        setCalculationError(
          "No valid public transport route found for these stops. Try nearby metro/bus/train-accessible places."
        );
        setTransportPlans([]);
        setSelectedPlanId("");
        setPlanReady(false);
        return;
      }

      const sorted = [...results].sort((a, b) => a.score - b.score);
      setTransportPlans(sorted);
      setSelectedPlanId(sorted[0].id);
      setPlanReady(true);

      localStorage.setItem(
        "tripPlan",
        JSON.stringify({
          plannedLocations: planned,
          mapMarkers: planned,
          transportPlans: serializePlansForStorage(sorted),
          selectedPlanId: sorted[0].id,
        })
      );
    } finally {
      setIsCalculating(false);
    }
  };

  // Clear trip
  const clearTrip = () => {
    setPlannedLocations([]);
    setMapMarkers([]);
    setTransportPlans([]);
    setSelectedPlanId("");
    setCalculationError("");
    setPlanReady(false);
    setLocations([{ name: "", suggestions: [] }]);
    setShowForm(false);
    localStorage.removeItem("tripPlan");
  };

  return (
    <motion.div
      className="w-full section-card p-5 md:p-6"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
    >
      <h2 className="section-title font-bold mb-2 text-xl flex items-center gap-2">
        <span>🧳</span>
        <span>Plan Your Trip</span>
      </h2>

      {/* Show Form or Trip Planner UI */}
      {!showForm && plannedLocations.length === 0 ? (
        <>
          <p className="text-sm text-slate-600 mb-5">
            Build a safer route with destination planning and map-linked waypoints.
          </p>

          <motion.div whileHover={{ scale: 1.03 }} className="flex justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 btn-accent hover:brightness-110 transition font-semibold"
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
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={loc.name}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={`Location ${index + 1}`}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl shadow-sm focus:ring focus:ring-emerald-200 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLocationInput(index)}
                  className="shrink-0 px-3 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
              {/* Suggestions Dropdown */}
              {loc.suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-slate-200 rounded-xl shadow-md w-full mt-1 max-h-40 overflow-y-auto">
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
              className="px-4 py-2 btn-primary hover:brightness-110 transition font-semibold"
            >
              + Add Location
            </button>
            <button
              type="submit"
              className="px-6 py-2 btn-accent hover:brightness-110 transition font-semibold"
            >
              Save Stops
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 btn-muted hover:brightness-110 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Google Map */}
          {mapMarkers.length > 0 && (
            <div className="w-full h-96 rounded-2xl overflow-hidden shadow-md border border-slate-200 mt-4">
              <GoogleMap
                center={mapMarkers[0]}
                zoom={5}
                mapContainerStyle={{ width: "100%", height: "100%" }}
              >
                {mapMarkers.map((marker, i) => (
                  <Marker key={i} position={marker} />
                ))}

                {selectedPlan?.directionsResult && (
                  <DirectionsRenderer
                    directions={selectedPlan.directionsResult}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: "#14532d",
                        strokeOpacity: 0.85,
                        strokeWeight: 5,
                      },
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          )}

          {/* Trip Plan List */}
          <div className="mt-6 p-4 bg-blue-50/70 rounded-2xl shadow border border-blue-100 text-sm">
            <h3 className="font-bold text-blue-700 mb-2">📝 Your Trip Plan</h3>
            <ol className="list-decimal pl-5 space-y-1">
              {plannedLocations.map((loc, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span>{loc.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePlannedStop(i)}
                    className="px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => calculatePlans(plannedLocations)}
                disabled={isCalculating || plannedLocations.length < 2}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {isCalculating ? "Calculating best route..." : "Compare Metro / Bus / Train"}
              </button>
              {planReady && (
                <button
                  onClick={() => {
                    const best = [...transportPlans].sort((a, b) => a.score - b.score)[0];
                    if (best) setSelectedPlanId(best.id);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                >
                  Pick Recommended Route
                </button>
              )}
            </div>

            {calculationError && (
              <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {calculationError}
              </div>
            )}
          </div>

          {transportPlans.length > 0 && (
            <div className="mt-4 grid gap-3">
              <h3 className="font-bold text-slate-800 text-sm">Best public transport options</h3>
              {transportPlans.map((plan) => {
                const isBest = recommendedPlan?.id === plan.id;
                const isSelected = selectedPlanId === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`text-left rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{plan.label}</p>
                        <p className="text-xs text-slate-500">{plan.note}</p>
                      </div>
                      {isBest && (
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-600 text-white">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                      <div className="bg-slate-50 rounded-lg px-2 py-2">
                        <div className="text-slate-500">Duration</div>
                        <div className="font-semibold">{plan.durationMin} min</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg px-2 py-2">
                        <div className="text-slate-500">Distance</div>
                        <div className="font-semibold">{plan.distanceKm} km</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg px-2 py-2">
                        <div className="text-slate-500">Safety</div>
                        <div className="font-semibold">{plan.safetyScore}/5</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg px-2 py-2">
                        <div className="text-slate-500">Transfers</div>
                        <div className="font-semibold">{plan.transfers}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg px-2 py-2">
                        <div className="text-slate-500">Alerts</div>
                        <div className="font-semibold">{plan.alertsAlongRoute}</div>
                      </div>
                    </div>
                    {Array.isArray(plan.vehicles) && plan.vehicles.length > 0 && (
                      <p className="mt-2 text-xs text-slate-600">
                        Uses: {plan.vehicles.join(", ")}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Plan Another Trip + Clear Trip Buttons */}
          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }}>
              <button
                onClick={() => {
                  setPlannedLocations([]);
                  setTransportPlans([]);
                  setSelectedPlanId("");
                  setPlanReady(false);
                  setShowForm(true);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition font-semibold"
              >
                Plan Another Trip
              </button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }}>
              <button
                onClick={clearTrip}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 transition font-semibold"
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

