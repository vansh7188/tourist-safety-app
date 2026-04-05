import React from "react";
import { motion } from "framer-motion";
import {
  FaBus,
  FaCarSide,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHeartbeat,
  FaShieldAlt,
  FaSkullCrossbones,
  FaTint,
} from "react-icons/fa";

function RiskZonesCard({ risks }) {
  return (
    <div className="analysis-card">
      <h3 className="analysis-card-title">Risk Zones</h3>
      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        {(risks || []).map((risk) => (
          <div key={risk} className="rounded-xl border border-rose-300/20 bg-rose-500/12 p-3">
            <p className="text-sm text-rose-100 font-semibold">{risk}</p>
            <p className="text-xs text-slate-300 mt-1">Avoid isolation and keep emergency contact ready.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScamThreatCard({ scams }) {
  return (
    <div className="analysis-card">
      <h3 className="analysis-card-title">Scam & Threat Intelligence</h3>
      <ul className="mt-4 space-y-2">
        {(scams || []).map((scam) => (
          <li key={scam} className="rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-50 flex items-center gap-2">
            <FaExclamationTriangle className="text-amber-300" />
            {scam}
          </li>
        ))}
      </ul>
    </div>
  );
}

function insightIcon(index) {
  if (index % 3 === 0) return <FaShieldAlt className="text-cyan-300" />;
  if (index % 3 === 1) return <FaCarSide className="text-emerald-300" />;
  return <FaHeartbeat className="text-amber-300" />;
}

function AIInsightsSection({ advice }) {
  return (
    <div className="analysis-card">
      <h3 className="analysis-card-title">AI Insights</h3>
      <div className="grid md:grid-cols-2 gap-3 mt-4">
        {(advice || []).map((item, index) => (
          <motion.div
            key={item.text}
            className="rounded-2xl border border-white/15 bg-white/6 p-4"
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xl">{insightIcon(index)}</span>
              <span className="text-xs rounded-full px-2 py-1 bg-cyan-500/20 border border-cyan-300/25 text-cyan-100">
                {Math.round(item.confidence || 0)}% confidence
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-100 font-medium">{item.text}</p>
            <p className="mt-2 text-xs text-slate-300">Based on: {item.basedOn || "local trend correlations"}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function HealthEnvironmentCard({ health }) {
  return (
    <div className="analysis-card">
      <h3 className="analysis-card-title">Health & Environment</h3>
      <div className="mt-4 space-y-3 text-sm text-slate-200">
        <div className="rounded-xl bg-white/6 border border-white/12 p-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2"><FaHeartbeat className="text-rose-300" /> Temperature</span>
          <span className="font-semibold">{health?.temp || "--"}°C</span>
        </div>
        <div className="rounded-xl bg-white/6 border border-white/12 p-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2"><FaTint className="text-sky-300" /> Water Quality</span>
          <span className="font-semibold">{health?.water || "Unknown"}</span>
        </div>
        <div className="rounded-xl bg-white/6 border border-white/12 p-3">
          <p className="inline-flex items-center gap-2 font-semibold"><FaSkullCrossbones className="text-amber-300" /> Disease Risks</p>
          <p className="text-slate-300 mt-2">{(health?.diseases || []).join(", ")}</p>
        </div>
      </div>
    </div>
  );
}

function TransportSafetyCard({ transport, score }) {
  return (
    <div className="analysis-card">
      <h3 className="analysis-card-title">Transport Safety</h3>
      <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-3">
          <p className="font-semibold text-emerald-100 inline-flex items-center gap-2"><FaCheckCircle /> Safe Options</p>
          <p className="text-slate-200 mt-2">{(transport?.safe || []).join(", ")}</p>
        </div>
        <div className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-3">
          <p className="font-semibold text-rose-100 inline-flex items-center gap-2"><FaExclamationTriangle /> Unsafe Options</p>
          <p className="text-slate-200 mt-2">{(transport?.unsafe || []).join(", ")}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/12 bg-white/6 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mb-2 inline-flex items-center gap-2">
          <FaBus /> Road Safety Indicator
        </p>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-rose-400 via-amber-400 to-emerald-400"
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.round(score || 0)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          />
        </div>
        <p className="text-right text-xs text-slate-300 mt-1">{Math.round(score || 0)}/100</p>
      </div>
    </div>
  );
}

function IntelligenceSections({ data }) {
  return (
    <motion.section
      className="space-y-4"
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <RiskZonesCard risks={data.risks} />
      <ScamThreatCard scams={data.scams} />
      <AIInsightsSection advice={data.advice} />
      <div className="grid md:grid-cols-2 gap-4">
        <HealthEnvironmentCard health={data.health} />
        <TransportSafetyCard transport={data.transport} score={data.factors?.transport} />
      </div>
    </motion.section>
  );
}

export default IntelligenceSections;
