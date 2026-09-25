import React from "react";
import { FaHome, FaUserCircle, FaComments, FaLifeRing, FaMapMarkedAlt } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

function MobileNavBar({ active, onChat, onNavigate }) {
  const { t } = useLanguage();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
      <div className="app-header rounded-2xl px-2 py-2 text-white flex items-center justify-around shadow-xl">
        <button
          type="button"
          onClick={() => onNavigate("/dashboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            active === "dashboard" ? "text-white" : "text-white/70"
          }`}
        >
          <FaHome className="text-base" />
          {t("home")}
        </button>

        <button
          type="button"
          onClick={() => onNavigate("/emergency")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            active === "emergency" ? "text-white" : "text-white/70"
          }`}
        >
          <FaLifeRing className="text-base" />
          {t("emergency")}
        </button>

        <button
          type="button"
          onClick={() => onNavigate("/guides")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            active === "guides" ? "text-white" : "text-white/70"
          }`}
        >
          <FaMapMarkedAlt className="text-base" />
          {t("guides")}
        </button>

        <button
          type="button"
          onClick={onChat}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-white"
        >
          <div className="h-8 w-8 rounded-full btn-accent flex items-center justify-center shadow-lg">
            <FaComments className="text-xs" />
          </div>
          {t("chat")}
        </button>

        <button
          type="button"
          onClick={() => onNavigate("/profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            active === "profile" ? "text-white" : "text-white/70"
          }`}
        >
          <FaUserCircle className="text-base" />
          {t("profile")}
        </button>
      </div>
    </div>
  );
}

export default MobileNavBar;
