import React, { useState } from "react";

function EmergencyHelperForm({ currentLocation, onPosted }) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getCoordinates = () => {
    const savedCoordinates = currentLocation?.latitude && currentLocation?.longitude
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : null;

    if (savedCoordinates) return Promise.resolve(savedCoordinates);
    if (!navigator.geolocation) {
      return Promise.reject(new Error("Location is not supported by this browser."));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
        () => reject(new Error("Allow location access before posting an emergency.")),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const submitEmergency = async (event) => {
    event.preventDefault();
    if ((!text.trim() && files.length === 0) || loading) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");
      const coordinates = await getCoordinates();
      const formData = new FormData();
      formData.append("text", text.trim());
      formData.append("lat", String(coordinates.lat));
      formData.append("lng", String(coordinates.lng));
      files.forEach((file) => formData.append("media", file));

      const response = await fetch(`${API_BASE_URL}/api/emergency`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to post emergency");

      setText("");
      setFiles([]);
      onPosted?.(data.post);
      setMessage("Emergency request sent to nearby helpers.");
    } catch (submitError) {
      setError(submitError.message || "Failed to post emergency");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitEmergency} className="mt-4 border-t border-rose-100 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-rose-900">Emergency Helper</h2>
          <p className="text-xs text-rose-800/75">Reach nearby people who are currently online.</p>
        </div>
        <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white">SOS NETWORK</span>
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What help do you need?"
        maxLength={2000}
        rows={3}
        className="w-full rounded-xl border border-rose-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-rose-300"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 4))}
          className="min-w-0 text-xs text-slate-600"
        />
        <button
          type="submit"
          disabled={loading || (!text.trim() && files.length === 0)}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending..." : "Post Emergency"}
        </button>
      </div>
      {message && <p className="mt-2 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p>}
    </form>
  );
}

export default EmergencyHelperForm;
