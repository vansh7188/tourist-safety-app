import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DigitalId from "../components/User_id_profile";
import TripPlan from "../components/trip_plan_profile";
import MobileNavBar from "../components/MobileNavBar";
import SafetyAlertIndicator from "../components/SafetyAlertIndicator";
import { SafetyAlertsProvider } from "../context/SafetyAlertsContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

function Pfile() {
  const [activeTab, setActiveTab] = useState("digitalId");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    console.log("Logged out successfully");
    navigate("/login");
  };

  return (
    <SafetyAlertsProvider>
      <div className="flex h-screen app-shell flex-col md:flex-row">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between gap-2"><p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("safeTravel")}</p><LanguageSwitcher dark /></div>
          <h2 className="text-2xl font-bold">{t("profile")}</h2>
        </div>
        <ul className="flex flex-col p-4 space-y-2">
          <li
            className={`p-3 rounded-lg cursor-pointer transition ${
              activeTab === "digitalId"
                ? "bg-emerald-500/20 text-emerald-200 font-semibold"
                : "hover:bg-white/10"
            }`}
            onClick={() => setActiveTab("digitalId")}
          >
            {t("digitalId")}
          </li>
          <li
            className={`p-3 rounded-lg cursor-pointer transition ${
              activeTab === "tripPlan"
                ? "bg-emerald-500/20 text-emerald-200 font-semibold"
                : "hover:bg-white/10"
            }`}
            onClick={() => setActiveTab("tripPlan")}
          >
            {t("tripPlan")}
          </li>
          <li
            className="p-3 rounded-lg cursor-pointer transition hover:bg-red-500/70 mt-8 border-t border-white/10 pt-4"
            onClick={handleLogout}
          >
            {t("logout")}
          </li>
        </ul>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto pb-28 md:pb-10">
        <div className="md:hidden mb-6">
          <div className="app-header rounded-2xl px-4 py-3 text-white shadow-lg flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/70">{t("safeTravel")}</div>
              <div className="text-xl font-bold">{t("profile")}</div>
            </div>
            <SafetyAlertIndicator />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("digitalId")}
              className={`px-4 py-2 rounded-full text-xs font-semibold ${
                activeTab === "digitalId"
                  ? "bg-emerald-500 text-white"
                  : "bg-white/70 text-slate-700"
              }`}
            >
              {t("digitalId")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tripPlan")}
              className={`px-4 py-2 rounded-full text-xs font-semibold ${
                activeTab === "tripPlan"
                  ? "bg-emerald-500 text-white"
                  : "bg-white/70 text-slate-700"
              }`}
            >
              {t("tripPlan")}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-rose-500 text-white"
            >
              {t("logout")}
            </button>
          </div>
        </div>
        {activeTab === "digitalId" && <DigitalId />}
        {activeTab === "tripPlan" && <TripPlan />}
      </div>

      <MobileNavBar
        active="profile"
        onChat={() => navigate("/dashboard")}
        onNavigate={navigate}
      />
    </div>
    </SafetyAlertsProvider>
  );
}

export default Pfile;
