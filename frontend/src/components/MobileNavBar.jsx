import React from "react";
import { FaHome, FaUserCircle, FaComments } from "react-icons/fa";

function MobileNavBar({ active, onChat, onNavigate }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-5 pb-4">
      <div className="app-header rounded-2xl px-4 py-3 text-white flex items-center justify-around shadow-xl">
        <button
          type="button"
          onClick={() => onNavigate("/dashboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            active === "dashboard" ? "text-white" : "text-white/70"
          }`}
        >
          <FaHome className="text-lg" />
          Home
        </button>

        <button
          type="button"
          onClick={onChat}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-white"
        >
          <div className="h-10 w-10 rounded-full btn-accent flex items-center justify-center shadow-lg">
            <FaComments className="text-base" />
          </div>
          Chat
        </button>

        <button
          type="button"
          onClick={() => onNavigate("/profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            active === "profile" ? "text-white" : "text-white/70"
          }`}
        >
          <FaUserCircle className="text-lg" />
          Profile
        </button>
      </div>
    </div>
  );
}

export default MobileNavBar;
