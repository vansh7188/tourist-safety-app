import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  const adminInfo = localStorage.getItem("adminInfo");

  // If no token or admin info, redirect to admin login
  if (!token || !adminInfo) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated, render the component
  return children;
}
