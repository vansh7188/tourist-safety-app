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
    <div>
      <h2 className="text-3xl font-bold text-blue-800 mb-4">Digital ID</h2>
      <p className="text-gray-700 mb-6">Manage your secure digital identity here.</p>

      {digitalId ? (
        <div>
          <div className="p-6 bg-white rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">Your Digital ID</h3>
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
            <div className="mt-4">
              <h4 className="font-semibold text-blue-600">Emergency Contacts:</h4>
              <ul className="list-disc list-inside">
                {digitalId.emergencyContacts.map((c, idx) => (
                  <li key={idx}>
                    {c.name} ({c.relation}) - {c.contact}
                    {c.email ? ` | ${c.email}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/digitalid/edit", { state: { digitalId } })}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
            >
              Edit ID
            </button>
            <button
              onClick={onDiscardClick}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition"
            >
              Discard ID
            </button>
          </div>
        </div>
      ) : (
        <button
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition"
          onClick={() => navigate("/DigitalidForm")}
        >
          Create Your Digital ID
        </button>
      )}

      {/* Confirmation Popup without background overlay */}
      {showConfirm && (
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-6 z-50 max-w-sm w-full">
          <p className="mb-6 text-lg font-semibold text-center">
            Are you sure you want to delete your digital ID?
          </p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={confirmDiscard}
            >
              Yes
            </button>
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              onClick={cancelDiscard}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DigitalId;
