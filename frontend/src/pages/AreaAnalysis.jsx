import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaLocationArrow, FaSpinner, FaUserCircle } from "react-icons/fa";

import AnalysisHero from "../components/analysis/AnalysisHero";
import WhyThisScoreSection from "../components/analysis/WhyThisScoreSection";
import AnalyticsSection from "../components/analysis/AnalyticsSection";
import IntelligenceSections from "../components/analysis/IntelligenceSections";
import FloatingPanicMenu from "../components/analysis/FloatingPanicMenu";
import MobileNavBar from "../components/MobileNavBar";
import {
  DUMMY_ANALYSIS_DATA,
  getAreaAnalysisWithLiveLocation,
} from "../services/areaAnalysisService";

import "../components/analysis/areaAnalysis.css";

function AreaAnalysis() {
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState(DUMMY_ANALYSIS_DATA);
  const [coords, setCoords] = useState({ lat: null, lng: null, source: "unknown" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAreaAnalysisWithLiveLocation();
      setAnalysisData(result.analysis || DUMMY_ANALYSIS_DATA);
      setCoords({ lat: result.lat, lng: result.lng, source: result.source || "unknown" });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setAnalysisData(DUMMY_ANALYSIS_DATA);
      setCoords({ lat: 28.6139, lng: 77.209, source: "fallback" });
      setError("Live analysis temporarily unavailable, showing fallback intelligence.");
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    loadAnalysis();
  }, [navigate, loadAnalysis]);

  const coordsText = useMemo(() => {
    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
      return "Coordinates unavailable";
    }

    return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (${coords.source})`;
  }, [coords]);

  return (
    <div className="analysis-page text-slate-100">
      <div className="analysis-shell">
        <header className="analysis-navbar px-4 md:px-5 py-3 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-slate-300">Safe Travel</p>
              <h1 className="text-lg md:text-2xl font-black">Area Analysis AI</h1>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition inline-flex items-center gap-2"
              >
                <FaUserCircle />
                Profile
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-300">
            <p className="inline-flex items-center gap-2">
              <FaLocationArrow />
              {coordsText}
            </p>
            <div className="flex items-center gap-2">
              <span>Last updated: {lastUpdated || "--"}</span>
              <button
                type="button"
                onClick={loadAnalysis}
                className="rounded-lg px-3 py-1.5 border border-cyan-200/30 bg-cyan-500/15 hover:bg-cyan-500/25 transition text-cyan-100"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-4 rounded-xl border border-amber-300/35 bg-amber-500/15 text-amber-100 text-sm px-4 py-3">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="section-card rounded-3xl py-14 px-6 flex flex-col items-center justify-center gap-3 bg-white/10 backdrop-blur-lg">
            <FaSpinner className="animate-spin text-2xl text-cyan-300" />
            <p className="text-slate-200">Analyzing your location and building safety intelligence...</p>
          </div>
        ) : (
          <main className="space-y-6 md:space-y-8 analysis-grid-fade">
            <AnalysisHero data={analysisData} />
            <WhyThisScoreSection data={analysisData} />
            <AnalyticsSection data={analysisData} />
            <IntelligenceSections data={analysisData} />
          </main>
        )}
      </div>

      <FloatingPanicMenu />

      <MobileNavBar
        active="analysis"
        onChat={() => navigate("/chatbot")}
        onNavigate={navigate}
      />
    </div>
  );
}

export default AreaAnalysis;
