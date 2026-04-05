import React from "react";
import { motion } from "framer-motion";
import {
  FaExclamationTriangle,
  FaCloudSun,
  FaSignal,
  FaShieldAlt,
} from "react-icons/fa";
import { getRiskTone, toPercent } from "./analysisUtils";

const alertIconMap = {
  crime: <FaExclamationTriangle />,
  weather: <FaCloudSun />,
  connectivity: <FaSignal />,
};

function getAlertIcon(alert) {
  const key = alert.toLowerCase();
  if (key.includes("crime")) return alertIconMap.crime;
  if (key.includes("weather") || key.includes("temp")) return alertIconMap.weather;
  if (key.includes("connect")) return alertIconMap.connectivity;
  return <FaShieldAlt />;
}

function SafetyRing({ score, ringColor }) {
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const normalized = toPercent(score);
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="relative z-10">
      <defs>
        <filter id="ringBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="18"
      />

      <motion.circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth="18"
        strokeLinecap="round"
        transform="rotate(-90 110 110)"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        filter="url(#ringBlur)"
      />
    </svg>
  );
}

function AnalysisHero({ data }) {
  const tone = getRiskTone(data.riskLevel);

  return (
    <motion.section
      className="section-card rounded-3xl p-6 md:p-8 analysis-hero relative overflow-hidden"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 28%, ${tone.glowColor}, transparent 62%)`,
        }}
        initial={{ opacity: 0.2 }}
        animate={{ opacity: [0.2, 0.55, 0.2] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          className="relative"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <SafetyRing score={data.safetyScore} ringColor={tone.ring} />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Safety Score</p>
            <p className="text-4xl font-black text-white leading-none mt-2">
              {toPercent(data.safetyScore)}
              <span className="text-xl font-bold text-slate-200">/100</span>
            </p>
          </div>
        </motion.div>

        <span className={`mt-3 border px-4 py-1 rounded-full text-sm font-semibold ${tone.badge}`}>
          {data.riskLevel}
        </span>

        <p className={`mt-4 text-sm md:text-base max-w-2xl ${tone.text}`}>{data.summary}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {(data.alerts || []).map((alert) => (
            <motion.span
              key={alert}
              whileHover={{ y: -2 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 text-slate-100 px-3 py-1.5 text-xs"
            >
              {getAlertIcon(alert)}
              <span>{alert}</span>
            </motion.span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default AnalysisHero;
