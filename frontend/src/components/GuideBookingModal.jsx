import React, { useState } from "react";
import { FaTimes, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaShieldAlt } from "react-icons/fa";

export default function GuideBookingModal({ guide, onClose, onBooked, apiBaseUrl }) {
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("hourly");
  const [hours, setHours] = useState(2);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!guide) return null;

  const calculateTotal = () => {
    if (duration === "hourly") return (guide.pricing?.hourly || 0) * hours;
    if (duration === "halfDay") return guide.pricing?.halfDay || 0;
    if (duration === "fullDay") return guide.pricing?.fullDay || 0;
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBaseUrl}/api/guides/${guide._id}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          duration,
          hours: duration === "hourly" ? Number(hours) : undefined,
          meetingPoint,
          notes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit booking");
      }

      onBooked?.(data.booking);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <FaTimes className="text-lg" />
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Booking Request</span>
          <h2 className="text-xl font-extrabold text-slate-900">
            Book {guide.userId?.name || "Guide"}
          </h2>
          {guide.city && <p className="text-xs text-slate-500">Location: {guide.city}</p>}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Tour Date
            </label>
            <div className="relative">
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tour Package / Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDuration("hourly")}
                className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                  duration === "hourly"
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Hourly
                <div className="text-[10px] font-normal text-slate-500">₹{guide.pricing?.hourly || 0}/hr</div>
              </button>
              <button
                type="button"
                onClick={() => setDuration("halfDay")}
                className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                  duration === "halfDay"
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Half Day (4 hrs)
                <div className="text-[10px] font-normal text-slate-500">₹{guide.pricing?.halfDay || 0}</div>
              </button>
              <button
                type="button"
                onClick={() => setDuration("fullDay")}
                className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                  duration === "fullDay"
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Full Day (8 hrs)
                <div className="text-[10px] font-normal text-slate-500">₹{guide.pricing?.fullDay || 0}</div>
              </button>
            </div>
          </div>

          {duration === "hourly" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Hours (1 - 8)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={hours}
                onChange={(e) => setHours(Math.max(1, Math.min(8, Number(e.target.value))))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Meeting Point / Hotel Pickup Address
            </label>
            <input
              type="text"
              placeholder="e.g. Hotel lobby, City Palace Gate 1"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Custom Requests or Places to visit
            </label>
            <textarea
              rows="2"
              placeholder="Tell the guide what you'd like to see..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-teal-600" />
              <div>
                <span className="text-xs font-extrabold text-teal-900">Total Price</span>
                <p className="text-[10px] text-teal-700">Payment made directly upon tour completion</p>
              </div>
            </div>
            <span className="text-xl font-black text-teal-950">₹{calculateTotal()}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[#04617B] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#034d62] disabled:opacity-50"
            >
              {submitting ? "Sending Request..." : "Confirm & Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
