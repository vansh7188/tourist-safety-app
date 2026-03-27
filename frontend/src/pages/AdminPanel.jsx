import React from "react";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminPanel() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-2">Users</h2>
            <p>Manage users, view profiles, and control access.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-2">Safety Alerts</h2>
            <p>Review, approve, or remove safety alerts.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-2">Analytics</h2>
            <p>View usage stats and system health.</p>
          </div>
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
