const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const DUMMY_ANALYSIS_DATA = {
  safetyScore: 78,
  riskLevel: "Moderate",
  summary:
    "This area is generally manageable for tourists in daytime hours, but incidents of theft and weak connectivity increase exposure after sunset. Stay on main roads and use verified transport providers.",
  alerts: ["Crime Level", "Weather Warning", "Connectivity Issues"],
  crime: { theft: 40, fraud: 30, violent: 30 },
  factors: { crime: 60, health: 80, transport: 70, environment: 75 },
  timeline: [
    { time: "Day", value: 80 },
    { time: "Night", value: 50 },
  ],
  health: {
    temp: 38,
    water: "Moderate",
    diseases: ["Dengue", "Heatstroke"],
  },
  scams: ["Fake tour guides", "Overpriced taxis", "Pickpocketing"],
  transport: { safe: ["Uber", "Auto"], unsafe: ["Unregistered taxis"] },
  risks: ["Night travel", "Crowded markets", "Unknown taxis"],
  advice: [
    {
      text: "Avoid late night travel",
      confidence: 87,
      basedOn: "Recent theft incidents between 9 PM and 1 AM",
      icon: "moon",
    },
    {
      text: "Use app-based transport",
      confidence: 90,
      basedOn: "Higher complaint rate from unregistered taxi pickups",
      icon: "car",
    },
  ],
};

export const AI_SAFETY_PROMPT_TEMPLATE = `You are an AI Safety Intelligence System.

Based on the given latitude and longitude, generate a structured safety analysis for a tourist.

Input:
Latitude: {lat}
Longitude: {lng}

Return a JSON response with the following:

1. safetyScore (0-100)

2. riskLevel (Safe / Moderate / Danger)

3. summary (short 2-3 line explanation)

4. alerts (array)
Examples:
- "High crime rate"
- "Extreme temperature"
- "Low connectivity"

5. crime:
- theft %
- fraud %
- violent %

6. factors:
- crime score
- health score
- transport score
- environment score

7. timeline:
- safety during day vs night

8. scams (top 3 common scams tourists face)

9. risks (real-world risky situations)

10. health:
- temperature
- water quality
- disease risks

11. transport:
- safe options
- unsafe options

12. advice:
- short actionable recommendations
- include confidence % (0-100)

Rules:
- Keep data realistic
- Focus on tourist perspective
- Avoid generic answers
- Be specific and practical
- Output strictly in JSON format`;

function getLatLngFromStoredLocation() {
  try {
    const current = JSON.parse(localStorage.getItem("currentLocation"));
    if (!current) return null;

    const lat =
      Number(current?.latitude) ||
      Number(current?.lat) ||
      Number(current?.coordinates?.lat) ||
      Number(current?.coordinates?.latitude);

    const lng =
      Number(current?.longitude) ||
      Number(current?.lng) ||
      Number(current?.lon) ||
      Number(current?.coordinates?.lng) ||
      Number(current?.coordinates?.longitude);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, source: "localStorage" };
    }
  } catch {
    return null;
  }

  return null;
}

export function buildAreaSafetyPrompt(lat, lng) {
  return AI_SAFETY_PROMPT_TEMPLATE.replace("{lat}", String(lat)).replace(
    "{lng}",
    String(lng)
  );
}

export async function getUserCoordinates() {
  const stored = getLatLngFromStoredLocation();
  if (stored) return stored;

  if (!navigator.geolocation) {
    return { lat: 28.6139, lng: 77.209, source: "fallback" };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
          source: "geolocation",
        });
      },
      () => {
        resolve({ lat: 28.6139, lng: 77.209, source: "fallback" });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000,
      }
    );
  });
}

export async function fetchAreaAnalysis(lat, lng) {
  const prompt = buildAreaSafetyPrompt(lat, lng);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis/area`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng, prompt }),
    });

    if (!response.ok) {
      throw new Error(`Area analysis request failed with ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid area analysis response");
    }

    return {
      ...DUMMY_ANALYSIS_DATA,
      ...payload,
      crime: { ...DUMMY_ANALYSIS_DATA.crime, ...(payload.crime || {}) },
      factors: { ...DUMMY_ANALYSIS_DATA.factors, ...(payload.factors || {}) },
      health: { ...DUMMY_ANALYSIS_DATA.health, ...(payload.health || {}) },
      transport: {
        ...DUMMY_ANALYSIS_DATA.transport,
        ...(payload.transport || {}),
      },
    };
  } catch {
    return DUMMY_ANALYSIS_DATA;
  }
}

export async function getAreaAnalysisWithLiveLocation() {
  const coords = await getUserCoordinates();
  const analysis = await fetchAreaAnalysis(coords.lat, coords.lng);
  return {
    lat: coords.lat,
    lng: coords.lng,
    source: coords.source,
    analysis,
  };
}
