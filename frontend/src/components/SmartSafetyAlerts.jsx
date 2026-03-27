import React, { useMemo, useState } from "react";
import { useSafetyAlerts } from "../context/SafetyAlertsContext";

const labelForType = (type) => {
  if (type === "danger") return "Danger";
  if (type === "low_network") return "Low Network";
  return "Info";
};

function SmartSafetyAlerts() {
  const { alerts, location, radiusKm } = useSafetyAlerts();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const detailedAlerts = useMemo(() => alerts, [alerts]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-700">Smart Area Safety Alerts</h3>
        <span className="text-xs text-gray-500">
          Radius: {radiusKm} km
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        {location ? (
          <span>
            Live location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </span>
        ) : (
          <span>Waiting for live location...</span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">Nearby alerts</div>
          <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
            {detailedAlerts.length === 0 && (
              <div className="text-xs text-gray-500">No alerts in your area.</div>
            )}
            {detailedAlerts.map((alert) => (
              <button
                type="button"
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className="text-left border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50"
              >
                <div className="text-sm font-semibold text-gray-800">
                  {labelForType(alert.type)}
                </div>
                <div className="text-xs text-gray-500">
                  {alert.severity} severity · {alert.distanceKm.toFixed(2)} km away
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">Alert details</div>
          {selectedAlert ? (
            <div className="text-sm text-gray-700 space-y-1">
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
            <div className="text-xs text-gray-500">Select an alert to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartSafetyAlerts;
