import React, { useMemo, useState } from "react";
import { useSafetyAlerts } from "../context/SafetyAlertsContext";

const labelForType = (type) => {
  if (type === "danger") return "Danger";
  if (type === "low_network") return "Low Network";
  return "Info";
};

const severityToRisk = (severity = "") => {
  const s = String(severity).toLowerCase();
  if (s === "high") return 3;
  if (s === "medium") return 2;
  return 1;
};

function SmartSafetyAlerts() {
  const { alerts, location, radiusKm } = useSafetyAlerts();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const detailedAlerts = useMemo(() => alerts, [alerts]);

  const areaRating = useMemo(() => {
    if (detailedAlerts.length === 0) return 5;
    const totalRisk = detailedAlerts.reduce(
      (sum, item) => sum + severityToRisk(item.severity),
      0
    );
    const averageRisk = totalRisk / detailedAlerts.length;
    const rating = Math.max(1, 5 - averageRisk + 1);
    return Number(rating.toFixed(1));
  }, [detailedAlerts]);

  const ratingTone =
    areaRating >= 4 ? "text-emerald-700" : areaRating >= 3 ? "text-amber-700" : "text-red-700";

  return (
    <div className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 border border-sky-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-800">Smart Area Safety Alerts</h3>
          <span className="text-xs text-slate-500">Radius: {radiusKm} km</span>
        </div>
        <div className="min-w-[120px] rounded-xl border border-white bg-white/90 px-3 py-2 text-right shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Area Rating
          </div>
          <div className={`text-3xl font-extrabold leading-none ${ratingTone}`}>
            {areaRating}
            <span className="text-sm font-semibold text-slate-500">/5</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-600 mb-3">
        {location ? (
          <span>
            Live location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </span>
        ) : (
          <span>Waiting for live location...</span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-slate-200 bg-white/90 rounded-xl p-3">
          <div className="text-sm font-semibold text-slate-700 mb-2">Nearby alerts</div>
          <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
            {detailedAlerts.length === 0 && (
              <div className="text-xs text-slate-500">No alerts in your area.</div>
            )}
            {detailedAlerts.map((alert) => (
              <button
                type="button"
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className="text-left border border-slate-200 rounded-lg px-3 py-2 hover:bg-sky-50"
              >
                <div className="text-sm font-semibold text-gray-800">
                  {labelForType(alert.type)}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  {alert.severity} severity · {alert.distanceKm.toFixed(2)} km away
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 bg-white/90 rounded-xl p-3">
          <div className="text-sm font-semibold text-slate-700 mb-2">Alert details</div>
          {selectedAlert ? (
            <div className="text-sm text-slate-700 space-y-1">
              <div>
                <span className="font-semibold">Type:</span> {labelForType(selectedAlert.type)}
              </div>
              <div>
                <span className="font-semibold">Severity:</span> {selectedAlert.severity}
              </div>
              <div>
                <span className="font-semibold">Radius:</span> {selectedAlert.radiusKm} km
              </div>
              <div>
                <span className="font-semibold">Distance:</span> {selectedAlert.distanceKm?.toFixed(2)} km
              </div>
              <div>
                <span className="font-semibold">Message:</span> {selectedAlert.message}
              </div>
              {selectedAlert.source && (
                <div>
                  <span className="font-semibold">Source:</span> {selectedAlert.source}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500">Select an alert to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartSafetyAlerts;
