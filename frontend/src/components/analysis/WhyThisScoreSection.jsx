import React from "react";
import { motion } from "framer-motion";
import { FaWifi, FaTemperatureHigh, FaUserSecret } from "react-icons/fa";

const indicators = [
  {
    key: "crime",
    label: "Crime",
    icon: FaUserSecret,
    trend: "up",
    tone: "text-rose-300 bg-rose-500/20 border-rose-300/35",
  },
  {
    key: "temp",
    label: "Temperature",
    icon: FaTemperatureHigh,
    trend: "up",
    tone: "text-amber-300 bg-amber-500/20 border-amber-300/35",
  },
  {
    key: "connectivity",
    label: "Connectivity",
    icon: FaWifi,
    trend: "down",
    tone: "text-sky-300 bg-sky-500/20 border-sky-300/35",
  },
];

function WhyThisScoreSection({ data }) {
  return (
    <motion.section
      className="section-card analysis-panel-dark rounded-3xl p-6 md:p-8"
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45 }}
    >
      <h2 className="text-xl md:text-2xl font-bold text-white">Why This Score?</h2>
      <p className="text-sm text-slate-200 mt-2">
        Your score blends local incident trends, climate stress, and movement reliability.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {indicators.map((item, index) => {
          const Icon = item.icon;
          const value =
            item.key === "crime"
              ? data.factors?.crime
              : item.key === "temp"
              ? data.health?.temp
              : 100 - (data.factors?.transport || 0) / 2;

          return (
            <motion.div
              key={item.key}
              className={`rounded-2xl border p-4 ${item.tone}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              whileHover={{ y: -3 }}
            >
              <div className="flex items-center justify-between">
                <Icon className="text-lg" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em]">
                  {item.trend === "up" ? "UP" : "DOWN"}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold">{item.label}</p>
              <p className="text-2xl font-black mt-1">{Math.round(value || 0)}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

export default WhyThisScoreSection;
