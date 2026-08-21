import React, { useState } from "react";
import { useEmergency } from "../context/useEmergency";

function IncomingEmergencyAlert({ inline = false, onAccepted, onOpenChat }) {
  const { alerts, dismissAlert } = useEmergency() || {};
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [acceptingPostId, setAcceptingPostId] = useState(null);
  const [acceptedPostIds, setAcceptedPostIds] = useState([]);
  const [error, setError] = useState("");

  if (!alerts?.length) return null;

  const acceptEmergency = async (alert) => {
    setAcceptingPostId(alert.postId);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/emergency/${alert.postId}/accept`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to accept emergency");
      setAcceptedPostIds((current) => (current.includes(alert.postId) ? current : [...current, alert.postId]));
      onAccepted?.({
        postId: alert.postId,
        text: alert.textSnippet || "Emergency request",
        roomId: data.roomId,
      });
    } catch (acceptError) {
      setError(acceptError.message || "Unable to accept emergency");
    } finally {
      setAcceptingPostId(null);
    }
  };

  return (
    <div className={inline
      ? "flex flex-col gap-4"
      : "fixed right-4 top-4 z-60 flex w-[min(92vw,390px)] flex-col gap-3"}
    >
      {alerts.map((alert) => (
        <article key={alert.postId} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xl">
          {/** Keep accepted state compact in a single action row to avoid card height jump. */}
          {(() => {
            const isAccepted = Boolean(alert.acceptedByMe) || acceptedPostIds.includes(alert.postId);
            return (
              <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Nearby emergency</p>
              <h2 className="mt-1 font-bold text-slate-900">{alert.requesterName || "A traveler"} needs help</h2>
            </div>
            <button type="button" onClick={() => dismissAlert(alert.postId)} className="text-xs font-semibold text-slate-500">Ignore</button>
          </div>
          <p className="mt-2 text-sm text-slate-700">{alert.textSnippet || "Media attached"}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {typeof alert.distanceMeters === "number" ? `${(alert.distanceMeters / 1000).toFixed(1)} km away` : "Nearby"}
          </p>
          {alert.mediaThumbnail && (
            <img src={alert.mediaThumbnail} alt="Emergency media" className="mt-3 h-28 w-full rounded-xl object-cover" />
          )}
          {isAccepted ? (
            <button
              type="button"
              onClick={() => onOpenChat?.(alert.postId)}
              className="mt-3 h-10 w-full rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Accepted | Open chat
            </button>
          ) : (
            <button
              type="button"
              onClick={() => acceptEmergency(alert)}
              disabled={acceptingPostId === alert.postId}
              className="mt-3 h-10 w-full rounded-xl bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {acceptingPostId === alert.postId ? "Connecting..." : "Accept and help"}
            </button>
          )}
          {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
              </>
            );
          })()}
        </article>
      ))}
    </div>
  );
}

export default IncomingEmergencyAlert;
