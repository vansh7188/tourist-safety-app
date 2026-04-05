export const riskTone = {
  Safe: {
    text: "text-emerald-200",
    badge: "bg-emerald-500/25 text-emerald-100 border-emerald-300/35",
    glowColor: "rgba(16, 185, 129, 0.55)",
    ring: "#34d399",
  },
  Moderate: {
    text: "text-amber-100",
    badge: "bg-amber-500/25 text-amber-100 border-amber-300/35",
    glowColor: "rgba(245, 158, 11, 0.55)",
    ring: "#f59e0b",
  },
  Danger: {
    text: "text-rose-100",
    badge: "bg-rose-500/25 text-rose-100 border-rose-300/35",
    glowColor: "rgba(244, 63, 94, 0.58)",
    ring: "#f43f5e",
  },
};

export function getRiskTone(level) {
  return riskTone[level] || riskTone.Moderate;
}

export function toPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

export function adviceIcon(icon) {
  switch (icon) {
    case "moon":
      return "moon";
    case "car":
      return "car";
    case "shield":
      return "shield";
    default:
      return "spark";
  }
}
