import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function DigitalId() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [digitalId, setDigitalId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDigitalId() {
      try {
        const email = localStorage.getItem("email");
        if (!email) {
          setError("User email not found. Please login.");
          setLoading(false);
          return;
        }
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/api/digitalid/digital-id?email=${encodeURIComponent(email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch Digital ID");
        const data = await res.json();
        if (data && data.length > 0) {
          setDigitalId(data[0]);
        } else {
          setDigitalId(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDigitalId();
  }, []);

  const onDiscardClick = () => setShowConfirm(true);
  const cancelDiscard = () => setShowConfirm(false);

  const confirmDiscard = async () => {
  try {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email"); 
    const res = await fetch(`${API_BASE_URL}/api/digitalid/digital-id`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }), // send email in body
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete Digital ID");
    }
    setDigitalId(null);
    setShowConfirm(false);
    localStorage.removeItem("digitalIdData");
  } catch (err) {
    setError(err.message);
    setShowConfirm(false);
  }
};

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Profile</p>
        <h2 className="text-3xl font-bold text-slate-900">Digital ID</h2>
        <p className="text-slate-600">Manage your secure digital identity here.</p>
      </div>

      {digitalId ? (
        <div>
          <div className="section-card p-6">
            <h3 className="text-xl font-semibold text-emerald-700 mb-4">Your Digital ID</h3>
            <div className="grid gap-2 text-sm text-slate-700">
              <p><strong>Name:</strong> {digitalId.name}</p>
              <p><strong>Contact:</strong> {digitalId.contactInfo}</p>
              <p><strong>KYC Type:</strong> {digitalId.kyc}</p>
              {digitalId.kyc === "aadhaar" && (
                <p><strong>Aadhaar:</strong> {digitalId.aadhaarNumber}</p>
              )}
              {digitalId.kyc === "passport" && (
                <>
                  <p><strong>Country:</strong> {digitalId.passportCountry}</p>
                  <p><strong>Passport No:</strong> {digitalId.passportNumber}</p>
                </>
              )}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-emerald-700">Emergency Contacts</h4>
              <ul className="mt-2 space-y-2">
                {digitalId.emergencyContacts.map((c, idx) => (
                  <li key={idx} className="rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm">
                    <div className="font-semibold text-slate-800">
                      {c.name} ({c.relation})
                    </div>
                    <div className="text-slate-600">
                      {c.contact}
                      {c.email ? ` · ${c.email}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/digitalid/edit", { state: { digitalId } })}
              className="px-6 py-3 btn-accent font-semibold hover:brightness-110 transition"
            >
              Edit ID
            </button>
            <button
              onClick={onDiscardClick}
              className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition"
            >
              Discard ID
            </button>
          </div>
        </div>
      ) : (
        <button
          className="px-6 py-3 btn-primary font-semibold hover:brightness-110 transition"
          onClick={() => navigate("/DigitalidForm")}
        >
          Create Your Digital ID
        </button>
      )}

      {/* Confirmation Popup without background overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="section-card max-w-sm w-full p-6">
            <p className="mb-6 text-lg font-semibold text-center text-slate-800">
              Are you sure you want to delete your digital ID?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
                onClick={confirmDiscard}
              >
                Yes
              </button>
              <button
                className="px-4 py-2 btn-muted hover:brightness-110"
                onClick={cancelDiscard}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DigitalId;
