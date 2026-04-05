// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard";
import Pfile from "./pages/Pfile";
import AreaAnalysis from "./pages/AreaAnalysis";
import DigitalidForm from "./components/DigitalidForm";
import { TravelProvider } from "./context/TravelContext";
import Chatbot from "./components/Chatbot";

import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPanicDetails from "./pages/AdminPanicDetails";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  return (
    <TravelProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={<Dashboard isLoaded={isLoaded} />} />
          <Route path="analysis" element={<AreaAnalysis />} />
          <Route path="profile" element={<Pfile />} />
          <Route path="digitalidform" element={<DigitalidForm />} />
          <Route path="digitalid/edit" element={<DigitalidForm />} />
          <Route path="chatbot" element={<Chatbot />} />

          <Route path="admin" element={<AdminPanel />} />

          {/* Admin Routes */}
          <Route path="admin/login" element={<AdminLogin />} />
          <Route
            path="admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="admin/panics/:id"
            element={
              <ProtectedAdminRoute>
                <AdminPanicDetails />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </Router>
    </TravelProvider>
  );
}

export default App;