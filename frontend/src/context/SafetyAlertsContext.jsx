import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_RADIUS_KM = 5;

const distanceKm = (a, b) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const SafetyAlertsContext = createContext(null);

export const useSafetyAlerts = () => {
  const ctx = useContext(SafetyAlertsContext);
  if (!ctx) {
    throw new Error("useSafetyAlerts must be used within SafetyAlertsProvider");
  }
  return ctx;
};

export const SafetyAlertsProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const triggeredAlertsRef = useRef(new Set());
  const lastFetchRef = useRef(0);

  const pushNotification = useCallback((message, tone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotifications((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      pushNotification("Geolocation is not supported in this browser.", "warning");
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
        pushNotification("Unable to access live location.", "error");
      },
      { enableHighAccuracy: true, maximumAge: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [pushNotification]);

  useEffect(() => {
    if (!location) return;

    const now = Date.now();
    if (now - lastFetchRef.current < 12000) return;
    lastFetchRef.current = now;

    const fetchAlerts = async () => {
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        radiusKm: String(DEFAULT_RADIUS_KM),
      });

      try {
        const response = await fetch(`${API_BASE_URL}/api/area-safety?${params}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          console.error("AI alerts fetch error:", data);
          throw new Error("AI alerts failed");
        }

        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      } catch (err) {
        console.error("AI alerts fetch failed:", err);
        try {
          const fallbackResponse = await fetch(`${API_BASE_URL}/api/alerts?${params}`);
          const fallbackData = await fallbackResponse.json().catch(() => ({}));
          if (fallbackResponse.ok) {
            setAlerts(Array.isArray(fallbackData.alerts) ? fallbackData.alerts : []);
          }
        } catch (fallbackError) {
          console.error("Fallback alerts fetch failed:", fallbackError);
        }
      }
    };

    fetchAlerts();
  }, [API_BASE_URL, location]);

  useEffect(() => {
    if (!location || alerts.length === 0) return;

    alerts.forEach((alert) => {
      const inside =
        typeof alert.distanceKm === "number"
          ? alert.distanceKm <= alert.radiusKm
          : distanceKm(location, alert.coordinates) <= alert.radiusKm;

      if (inside && !triggeredAlertsRef.current.has(alert.id)) {
        triggeredAlertsRef.current.add(alert.id);
        const typeLabel = alert.type === "danger" ? "High crime area" : alert.type === "low_network" ? "Low network" : "Area info";
        const tone = alert.type === "danger" ? "error" : alert.type === "low_network" ? "warning" : "success";
        pushNotification(`⚠️ ${typeLabel} nearby: ${alert.message}`, tone);
      }
    });
  }, [alerts, location, pushNotification]);

  const detailedAlerts = useMemo(() => {
    if (!location) return [];
    return alerts.map((alert) => {
      const km =
        typeof alert.distanceKm === "number"
          ? alert.distanceKm
          : distanceKm(location, alert.coordinates);
      return { ...alert, distanceKm: km };
    });
  }, [alerts, location]);

  const status = useMemo(() => {
    if (!location) return "unknown";
    const active = detailedAlerts.filter((alert) => alert.distanceKm <= alert.radiusKm);
    if (active.some((alert) => alert.type === "danger")) return "danger";
    if (active.some((alert) => alert.type === "low_network")) return "low_network";
    if (active.length > 0) return "info";
    return "normal";
  }, [detailedAlerts, location]);

  const value = useMemo(
    () => ({
      location,
      alerts: detailedAlerts,
      notifications,
      status,
      radiusKm: DEFAULT_RADIUS_KM,
    }),
    [detailedAlerts, location, notifications, status]
  );

  return (
    <SafetyAlertsContext.Provider value={value}>
      {children}
    </SafetyAlertsContext.Provider>
  );
};
