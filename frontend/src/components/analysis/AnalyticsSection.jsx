import React from "react";
import { motion } from "framer-motion";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";

const crimePalette = ["#f97316", "#eab308", "#ef4444"];

function DonutChart({ crime }) {
  const entries = Object.entries(crime || {});
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="analysis-card h-full">
      <h3 className="analysis-card-title">Crime Distribution</h3>
      <div className="relative flex items-center justify-center mt-4">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={radius} stroke="rgba(255,255,255,0.18)" strokeWidth="20" fill="none" />
          {entries.map(([label, value], index) => {
            const val = Number(value) || 0;
            const segmentLength = (val / 100) * circumference;
            const dashArray = `${segmentLength} ${circumference - segmentLength}`;
            const dashOffset = -cumulative;
            cumulative += segmentLength;

            return (
              <motion.circle
                key={label}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={crimePalette[index % crimePalette.length]}
                strokeWidth="20"
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                initial={{ opacity: 0, strokeDashoffset: circumference }}
                whileInView={{ opacity: 1, strokeDashoffset: dashOffset }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.08 }}
              />
            );
          })}
        </svg>

        <div className="absolute text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Status</p>
          <p className="text-sm font-semibold text-amber-300 mt-1">High Theft Area</p>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm">
        {entries.map(([label, value], index) => (
          <div key={label} className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-slate-200 capitalize">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: crimePalette[index % crimePalette.length] }} />
              {label}
            </span>
            <span className="text-slate-100 font-semibold">{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactorBars({ factors }) {
  return (
    <div className="analysis-card h-full">
      <h3 className="analysis-card-title">Safety Factors</h3>
      <div className="space-y-4 mt-5">
        {Object.entries(factors || {}).map(([name, value], index) => {
          const val = Number(value) || 0;
          return (
            <div key={name}>
              <div className="flex items-center justify-between text-xs text-slate-300 uppercase tracking-[0.2em] mb-1.5">
                <span>{name}</span>
                <span>{val}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-cyan-400 via-emerald-400 to-amber-400"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${val}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.07 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineChart({ timeline }) {
  const width = 330;
  const height = 170;
  const padding = 22;

  const points = (timeline || []).map((item, index) => {
    const x = padding + index * ((width - padding * 2) / Math.max((timeline?.length || 2) - 1, 1));
    const y = height - padding - ((Number(item.value) || 0) / 100) * (height - padding * 2);
    return { x, y, label: item.time, value: item.value };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const linePath = points.map((p, index) => `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    points.length > 1
      ? `M ${points[0].x} ${height - padding} ${linePath.replace("M", "L")} L ${points[points.length - 1].x} ${
          height - padding
        } Z`
      : "";

  return (
    <div className="analysis-card h-full">
      <div className="flex items-center justify-between gap-3">
        <h3 className="analysis-card-title">Safety Timeline</h3>
        <span className="rounded-full border border-rose-300/30 bg-rose-500/20 text-rose-100 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1">
          Night Risk High
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full mt-4 overflow-visible">
        {areaPath ? <path d={areaPath} fill="rgba(56,189,248,0.16)" /> : null}
        <polyline points={polyline} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="4" fill="#f8fafc" />
            <text x={p.x} y={height - 6} textAnchor="middle" className="fill-slate-300 text-[10px]">
              {p.label}
            </text>
            <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-slate-100 text-[10px]">
              {p.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RiskHighlightsCard({ data }) {
  const day = data.timeline?.find((entry) => entry.time?.toLowerCase().includes("day"))?.value || 0;
  const night = data.timeline?.find((entry) => entry.time?.toLowerCase().includes("night"))?.value || 0;
  const gap = Math.max(0, day - night);

  const highlights = [
    {
      icon: <FaArrowTrendDown className="text-rose-300" />,
      text: `Night safety drops by ${gap} points compared to day movement.`,
    },
    {
      icon: <FaArrowTrendUp className="text-amber-300" />,
      text: `Theft contributes ${data.crime?.theft || 0}% of reported risk signals.`,
    },
    {
      icon: <FaArrowTrendUp className="text-cyan-300" />,
      text: `Transport reliability is currently ${data.factors?.transport || 0}/100.`,
    },
  ];

  return (
    <div className="analysis-card h-full">
      <h3 className="analysis-card-title">Risk Highlights</h3>
      <ul className="mt-4 space-y-3">
        {highlights.map((item) => (
          <li key={item.text} className="rounded-xl border border-white/15 bg-white/5 p-3 flex items-start gap-3">
            <span className="mt-0.5">{item.icon}</span>
            <p className="text-sm text-slate-200">{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalyticsSection({ data }) {
  return (
    <motion.section
      className="space-y-4"
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <h2 className="text-xl md:text-2xl font-bold text-white">Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <DonutChart crime={data.crime} />
        <FactorBars factors={data.factors} />
        <TimelineChart timeline={data.timeline} />
        <RiskHighlightsCard data={data} />
      </div>
    </motion.section>
  );
}

export default AnalyticsSection;
