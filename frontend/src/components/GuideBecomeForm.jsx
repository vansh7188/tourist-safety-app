import React, { useState, useEffect } from "react";
import { FaCamera, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function GuideBecomeForm({ existingGuide, onSaved, apiBaseUrl }) {
  const [bio, setBio] = useState(existingGuide?.bio || "");
  const [city, setCity] = useState(existingGuide?.city || "");
  const [languages, setLanguages] = useState(existingGuide?.languages?.join(", ") || "");
  const [specialties, setSpecialties] = useState(existingGuide?.specialties?.join(", ") || "");
  const [experienceYears, setExperienceYears] = useState(existingGuide?.experienceYears || 0);
  const [hourlyRate, setHourlyRate] = useState(existingGuide?.pricing?.hourly || 500);
  const [halfDayRate, setHalfDayRate] = useState(existingGuide?.pricing?.halfDay || 1800);
  const [fullDayRate, setFullDayRate] = useState(existingGuide?.pricing?.fullDay || 3200);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("bio", bio);
      formData.append("city", city);
      formData.append(
        "languages",
        JSON.stringify(
          languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      formData.append(
        "specialties",
        JSON.stringify(
          specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      formData.append("experienceYears", Number(experienceYears));
      formData.append("hourlyRate", Number(hourlyRate));
      formData.append("halfDayRate", Number(halfDayRate));
      formData.append("fullDayRate", Number(fullDayRate));

      if (coverPhoto) {
        formData.append("coverPhoto", coverPhoto);
      }

      // Geolocation fallback
      const currentLocation = JSON.parse(localStorage.getItem("currentLocation") || "null");
      if (currentLocation?.lat && currentLocation?.lng) {
        formData.append("latitude", currentLocation.lat);
        formData.append("longitude", currentLocation.lng);
      }

      const endpoint = existingGuide ? `${apiBaseUrl}/api/guides/profile` : `${apiBaseUrl}/api/guides/register`;
      const method = existingGuide ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save guide profile");

      setSuccess(existingGuide ? "Profile updated successfully!" : "Registered as guide successfully!");
      onSaved?.(data.guide);
    } catch (err) {
      setError(err.message || "Failed to submit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <FaExclamationTriangle className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <FaCheckCircle className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          City / Primary Guiding Area *
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Jaipur, Rajasthan or Mumbai, Maharashtra"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          About You / Guide Bio *
        </label>
        <textarea
          rows="3"
          required
          placeholder="Introduce yourself, your passion for your city, and why tourists love touring with you..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Languages Spoken (comma separated)
          </label>
          <input
            type="text"
            placeholder="English, Hindi, French, Japanese"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Years of Experience
          </label>
          <input
            type="number"
            min="0"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Specialties / Tour Themes (comma separated)
        </label>
        <input
          type="text"
          placeholder="Heritage, Street Food, Architecture, Trekking, Photography"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-600 mb-3">
          Pricing Setup (in ₹ INR)
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Hourly Rate (₹)</label>
            <input
              type="number"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Half Day (4 hrs)</label>
            <input
              type="number"
              min="0"
              value={halfDayRate}
              onChange={(e) => setHalfDayRate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Day (8 hrs)</label>
            <input
              type="number"
              min="0"
              value={fullDayRate}
              onChange={(e) => setFullDayRate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Cover Photo / Profile Banner
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverPhoto(e.target.files?.[0] || null)}
            className="text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-teal-700 hover:file:bg-teal-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#04617B] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#034d62] disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : existingGuide
          ? "Save & Update Profile"
          : "Complete Guide Registration"}
      </button>
    </form>
  );
}
