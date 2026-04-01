import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaTrash,
  FaCheckCircle,
  FaClipboardList,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaChartBar,
  FaSpinner,
  FaExclamation,
  FaInfoCircle,
  FaLongArrowAltRight,
  FaCloudUploadAlt,
  FaWifi,
} from "react-icons/fa";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // State
  const [panics, setPanics] = useState([]);
  const [filteredPanics, setFilteredPanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [stats, setStats] = useState(null);

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [deliverySourceFilter, setDeliverySourceFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const token = localStorage.getItem("adminToken");

  // Verify admin and fetch data on mount
  useEffect(() => {
    const adminData = localStorage.getItem("adminInfo");
    if (!adminData || !token) {
      navigate("/admin/login");
      return;
    }
    setAdminInfo(JSON.parse(adminData));
    fetchDashboardData();
  }, [token, navigate]);

  // Fetch panic requests
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        search: searchTerm,
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(deliverySourceFilter && { deliverySource: deliverySourceFilter }),
        sortBy,
        order: sortOrder === "asc" ? "asc" : "desc",
        page: currentPage,
        limit: itemsPerPage,
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/panics?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminInfo");
          navigate("/admin/login");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setPanics(data.data);
      applyFilters(data.data);

      // Fetch stats
      fetchStats();
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.summary);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Apply filters to panics
  const applyFilters = (data) => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(
        (panic) =>
          panic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          panic.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          panic.contact_number.includes(searchTerm) ||
          (panic.panic_query &&
            panic.panic_query.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((panic) => panic.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter((panic) => panic.priority === priorityFilter);
    }

    if (deliverySourceFilter) {
      filtered = filtered.filter(
        (panic) => (panic.delivery_source || "direct") === deliverySourceFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "resolvedAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredPanics(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (panics.length > 0) {
      applyFilters(panics);
    } else {
      setFilteredPanics([]);
    }
  }, [panics, searchTerm, statusFilter, priorityFilter, deliverySourceFilter, sortBy, sortOrder]);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

  const handleDeletePanic = async (panicId) => {
    const confirmed = window.confirm(
      "Delete this resolved panic request? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(panicId);
      const response = await fetch(`${API_BASE_URL}/api/admin/panics/${panicId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete panic request");
      }

      setPanics((prev) => prev.filter((p) => p._id !== panicId));
      setFilteredPanics((prev) => prev.filter((p) => p._id !== panicId));
      fetchStats();
    } catch (err) {
      setError(err.message || "Failed to delete panic request");
    } finally {
      setDeletingId(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "critical":
        return <FaExclamationTriangle className="w-4 h-4" />;
      case "high":
        return <FaExclamation className="w-4 h-4" />;
      default:
        return <FaInfoCircle className="w-4 h-4" />;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredPanics.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedPanics = filteredPanics.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            {adminInfo && (
              <p className="text-gray-600 text-sm">
                Welcome, {adminInfo.name} ({adminInfo.role})
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <FaClipboardList />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.totalPanics}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <FaFilter />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.pendingPanics}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <FaSpinner className="animate-spin" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.inProgressPanics}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <FaCheckCircle />
                <span className="text-sm font-medium">Resolved</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.resolvedPanics}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <FaExclamationTriangle />
                <span className="text-sm font-medium">Critical</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.criticalPanics}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <FaChartBar />
                <span className="text-sm font-medium">High</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.highPanics}
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, contact, or issue..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery
              </label>
              <select
                value={deliverySourceFilter}
                onChange={(e) => setDeliverySourceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Delivery Types</option>
                <option value="direct">Direct (Online)</option>
                <option value="offline_queue">Offline Queue</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Panic Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <FaSpinner className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600 mt-2">Loading panic requests...</p>
            </div>
          ) : paginatedPanics.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p>No panic requests found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Issue
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Delivery
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPanics.map((panic) => (
                      <tr
                        key={panic._id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {panic.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {panic.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {panic.contact_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                          {panic.panic_query || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {(panic.delivery_source || "direct") === "offline_queue" ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              <FaCloudUploadAlt className="w-3 h-3" />
                              Offline Queue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <FaWifi className="w-3 h-3" />
                              Direct
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                              panic.priority
                            )}`}
                          >
                            {getPriorityIcon(panic.priority)}
                            {panic.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              panic.status
                            )}`}
                          >
                            {panic.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(panic.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/panics/${panic._id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                            >
                              <FaEye className="w-4 h-4" />
                              View
                            </button>
                            {panic.status === "resolved" && (
                              <button
                                onClick={() => handleDeletePanic(panic._id)}
                                disabled={deletingId === panic._id}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <FaTrash className="w-4 h-4" />
                                {deletingId === panic._id ? "Deleting..." : "Delete"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-4 border-t bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {startIdx + 1} to {Math.min(endIdx, filteredPanics.length)} of{" "}
                  {filteredPanics.length} requests
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
