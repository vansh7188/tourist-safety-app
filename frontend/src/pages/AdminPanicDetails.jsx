import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaClipboardList,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSave,
  FaCalendar,
  FaImage,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function PanicDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [panic, setPanic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    status: "",
    priority: "",
    notes: "",
  });

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchPanicDetails();
  }, [id, token, navigate]);

  const fetchPanicDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/panics/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch panic details");
      }

      const data = await response.json();
      setPanic(data.data);
      setFormData({
        status: data.data.status,
        priority: data.data.priority,
        notes: data.data.notes || "",
      });

      // Fetch media only for this panic request
      if (data.data.panic_request_id) {
        fetchPanicMedia(data.data.panic_request_id);
      } else {
        setMedia([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPanicMedia = async (panicRequestId) => {
    try {
      setMediaLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/digitalid/panic-photos?panic_request_id=${encodeURIComponent(
          panicRequestId
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data = await response.json();
      
      // Extract all photo URLs from all media records
      const allPhotos = [];
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((record) => {
          if (record.photo_urls && Array.isArray(record.photo_urls)) {
            allPhotos.push(...record.photo_urls);
          }
        });
      }
      
      setMedia(allPhotos);
      setCurrentMediaIndex(0);
    } catch (err) {
      console.error("Error fetching panic media:", err);
      setMedia([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/panics/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update panic");
      }

      const data = await response.json();
      setPanic(data.data);
      alert("Panic request updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-blue-600 bg-blue-50";
      case "in_progress":
        return "text-purple-600 bg-purple-50";
      case "resolved":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading panic details...</p>
        </div>
      </div>
    );
  }

  if (!panic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Panic request not found</p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <FaArrowLeft />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panic Request Details</h1>
            <p className="text-gray-600 text-sm">ID: {panic._id}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Panic Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaUser className="text-blue-600" />
                User Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <p className="text-gray-900">{panic.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="text-gray-900">{panic.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Number
                  </label>
                  <p className="text-gray-900">{panic.contact_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    KYC Type
                  </label>
                  <p className="text-gray-900">
                    {panic.kyc?.aadhaar?.number && "Aadhaar"}
                    {panic.kyc?.passport?.number && "Passport"}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            {panic.emergency_contacts && panic.emergency_contacts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaPhone className="text-green-600" />
                  Emergency Contacts
                </h2>
                <div className="space-y-3">
                  {panic.emergency_contacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-green-500 pl-4 py-2"
                    >
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">
                        {contact.relation}
                      </p>
                      <p className="text-sm text-gray-700">{contact.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panic Query and Location */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaClipboardList className="text-purple-600" />
                Panic Details
              </h2>
              <div className="space-y-4">
                {panic.panic_query && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue/Query
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {panic.panic_query}
                    </p>
                  </div>
                )}

                {panic.locations && panic.locations.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-red-600" />
                      Locations
                    </label>
                    <div className="space-y-2">
                      {panic.locations.map((loc, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-3 rounded border border-gray-200"
                        >
                          <p className="font-medium text-gray-900">
                            {loc.detailed_address || `${loc.city}, ${loc.state}`}
                          </p>
                          {loc.coordinates && (
                            <p className="text-xs text-gray-600">
                              Lat: {loc.coordinates.coordinates[1]}, Lng:{" "}
                              {loc.coordinates.coordinates[0]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600 border-t pt-4">
                  <p>
                    <span className="font-medium">Reported:</span>{" "}
                    {formatDate(panic.createdAt)}
                  </p>
                  {panic.resolvedAt && (
                    <p>
                      <span className="font-medium">Resolved:</span>{" "}
                      {formatDate(panic.resolvedAt)}
                    </p>
                  )}
                </div>
              </div>            </div>

            {/* Media Gallery */}
            {(media.length > 0 || mediaLoading) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaImage className="text-blue-600" />
                  Panic Event Media ({media.length})
                </h2>

                {mediaLoading ? (
                  <div className="text-center py-8">
                    <FaSpinner className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-gray-600">Loading media...</p>
                  </div>
                ) : media.length > 0 ? (
                  <div className="space-y-4">
                    {/* Media Display */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <img
                        src={media[currentMediaIndex]}
                        alt={`Media ${currentMediaIndex + 1}`}
                        className="w-full h-full object-contain"
                      />

                      {/* Navigation Buttons */}
                      {media.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setCurrentMediaIndex((prev) =>
                                prev === 0 ? media.length - 1 : prev - 1
                              )
                            }
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
                          >
                            <FaChevronLeft className="text-gray-800" />
                          </button>
                          <button
                            onClick={() =>
                              setCurrentMediaIndex((prev) =>
                                prev === media.length - 1 ? 0 : prev + 1
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
                          >
                            <FaChevronRight className="text-gray-800" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {media.length > 1 && (
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {media.map((photoUrl, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentMediaIndex(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                              idx === currentMediaIndex
                                ? "border-blue-500 ring-2 ring-blue-300"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Counter */}
                    <div className="text-center text-sm text-gray-600">
                      Photo {currentMediaIndex + 1} of {media.length}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No media files available for this panic request
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Status Update Form */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleUpdate}
              className="bg-white rounded-lg shadow p-6 sticky top-20"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6">Update Status</h2>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                    formData.status
                  )}`}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Priority */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange("priority", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(
                    formData.priority
                  )}`}
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Add internal notes about this panic..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                />
              </div>

              {/* Current Status Info */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Current Status:</span>{" "}
                  <span className={getStatusColor(panic.status)}>
                    {panic.status.replace("_", " ").toUpperCase()}
                  </span>
                </p>
                <p className="text-gray-700 mt-2">
                  <span className="font-medium">Current Priority:</span>{" "}
                  <span className={getPriorityColor(panic.priority)}>
                    {panic.priority.toUpperCase()}
                  </span>
                </p>
              </div>

              {/* Update Button */}
              <button
                type="submit"
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {updating ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Update
                  </>
                )}
              </button>

              {/* Quick Actions */}
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange("status", "in_progress");
                    handleInputChange("priority", "high");
                  }}
                  className="w-full px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition font-medium"
                >
                  <FaExclamationTriangle className="inline mr-2" />
                  Mark High Priority
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange("status", "resolved");
                  }}
                  className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
                >
                  <FaCheckCircle className="inline mr-2" />
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
