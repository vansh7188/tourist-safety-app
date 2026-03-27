import React from "react";
import { FaUserShield, FaUsers, FaBell, FaChartBar } from "react-icons/fa";

const navItems = [
  { label: "Dashboard", icon: <FaUserShield />, href: "/admin" },
  { label: "Users", icon: <FaUsers />, href: "/admin/users" },
  { label: "Alerts", icon: <FaBell />, href: "/admin/alerts" },
  { label: "Analytics", icon: <FaChartBar />, href: "/admin/analytics" },
];

export default function AdminSidebar() {
  return (
    <aside className="w-20 md:w-56 bg-white shadow h-screen flex flex-col">
      <div className="flex items-center justify-center h-16 border-b">
        <span className="text-xl font-bold text-blue-600">Admin</span>
      </div>
      <nav className="flex-1 flex flex-col gap-2 mt-4">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="hidden md:inline">{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
