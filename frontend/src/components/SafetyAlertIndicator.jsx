import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSafetyAlerts } from "../context/SafetyAlertsContext";

const statusLabel = (status) => {
  if (status === "danger") return "High crime";
  if (status === "low_network") return "Low network";
  if (status === "info") return "Area info";
  if (status === "normal") return "Normal area";
  return "Checking";
};

const statusClasses = (status) => {
  if (status === "danger") return "bg-red-600 text-white";
  if (status === "low_network") return "bg-amber-400 text-gray-900";
  if (status === "info") return "bg-blue-500 text-white";
  if (status === "normal") return "bg-green-500 text-white";
  return "bg-gray-300 text-gray-700";
};

const labelForType = (type) => {
  if (type === "danger") return "Danger";
  if (type === "low_network") return "Low Network";
  return "Info";
};

function SafetyAlertIndicator() {
  const { alerts, location, notifications, status, radiusKm } = useSafetyAlerts();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.distanceKm <= alert.radiusKm),
    [alerts]
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-end gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
        AI powered
      </span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow ${statusClasses(status)}`}
      >
        <span className="h-2 w-2 rounded-full bg-white/80" />
        {statusLabel(status)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg z-50">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            Smart Area Safety
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Radius: {radiusKm} km
          </div>

          <div className="text-xs text-gray-600 mb-3">
            {location
              ? `Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}`
              : "Waiting for live location..."}
          </div>

          {activeAlerts.length === 0 ? (
            <div className="text-xs text-gray-500">No active alerts nearby.</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="border border-gray-200 rounded-md p-2">
                  <div className="text-xs font-semibold text-gray-800">
                    {labelForType(alert.type)} · {alert.severity}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {alert.message}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {alert.distanceKm.toFixed(2)} km away
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {notifications.slice(-2).map((note) => (
                <div
                  key={note.id}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold text-white ${
                    note.tone === "success"
                      ? "bg-green-600"
                      : note.tone === "error"
                      ? "bg-red-600"
                      : "bg-amber-500"
                  }`}
                >
                  {note.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SafetyAlertIndicator;
