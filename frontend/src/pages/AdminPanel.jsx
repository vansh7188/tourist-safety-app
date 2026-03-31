import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminPanel() {
  const [panicRequests, setPanicRequests] = useState([]);
  const [panicPhotos, setPanicPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPanicRequests();
    fetchPanicPhotos();
  }, []);

  const fetchPanicRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/digitalid/panic`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch panic requests: ${response.status}`);
      }

      const data = await response.json();
      setPanicRequests(data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching panic requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const fetchPanicPhotos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/digitalid/panic-photos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch panic photos: ${response.status}`);
      }

      const data = await response.json();
      setPanicPhotos(data.data || []);
    } catch (err) {
      console.error("Error fetching panic photos:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => {
              fetchPanicRequests();
              fetchPanicPhotos();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-2">Users</h2>
            <p>Manage users, view profiles, and control access.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-2">Safety Alerts</h2>
            <p className="text-2xl font-bold text-red-600 mb-2">{panicRequests.length}</p>
            <p>Active panic requests in system.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-2">Analytics</h2>
            <p>View usage stats and system health.</p>
          </div>
        </div>

        {/* Panic Requests Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">Recent Panic Requests</h2>

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading panic requests...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>Error loading panic requests: {error}</p>
            </div>
          )}

          {!loading && !error && panicRequests.length === 0 && (
            <p className="text-gray-500 text-center py-4">No panic requests found.</p>
          )}

          {!loading && !error && panicRequests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Contact</th>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {panicRequests.slice(0, 10).map((request, index) => (
                    <tr key={request._id || index} className="border-t">
                      <td className="px-4 py-2">{request.name}</td>
                      <td className="px-4 py-2">{request.email}</td>
                      <td className="px-4 py-2">{request.contact_number}</td>
                      <td className="px-4 py-2 max-w-xs truncate">
                        {request.locations?.[0]?.detailed_address || "N/A"}
                      </td>
                      <td className="px-4 py-2">{formatDate(request.createdAt)}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">Recent Panic Photos</h2>
          {panicPhotos.length === 0 ? (
            <p className="text-gray-500">No panic photos found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {panicPhotos.slice(0, 9).map((record) => (
                <div key={record._id} className="border rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-1">{record.email} • {new Date(record.createdAt).toLocaleString()}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {record.photo_urls?.map((url, i) => (
                      <img key={i} src={url} alt={`panic-${i}`} className="w-full h-28 object-cover rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <ul className="space-y-2">
            <li className="text-blue-600 hover:underline cursor-pointer">Add new user</li>
            <li className="text-blue-600 hover:underline cursor-pointer">Create alert</li>
            <li className="text-blue-600 hover:underline cursor-pointer">Export data</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
