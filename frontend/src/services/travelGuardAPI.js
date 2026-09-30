// Travel Guard AI API client
// Deployed URL: https://inttravel-main.onrender.com
// Uses '/travelguard' dev proxy in local development to prevent CORS issues,
// and falls back directly to the deployed URL in production or standalone builds.

const REMOTE_URL = import.meta.env.VITE_TRAVEL_GUARD_API_URL || "https://inttravel-main.onrender.com";
const BASE = import.meta.env.DEV ? "/travelguard" : REMOTE_URL.replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Request failed");
  }
  return data;
}

export async function buildAIPlan(destination, days, travelerType) {
  return request("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination, days, travelerType }),
  });
}

export async function triggerDisruption(payload) {
  return request("/api/disruptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function bookGuide(guideId, day, destination) {
  return request("/api/book-guide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guide_id: guideId, day, destination }),
  });
}

export async function getDataOverview() {
  return request("/api/data-overview");
}

export async function getMLStatus() {
  return request("/api/ml-status");
}

export async function getRecommendations(destination, limit = 12) {
  const params = new URLSearchParams({ destination, limit: String(limit) });
  return request(`/api/recommendations?${params}`);
}

export async function getHealthCheck() {
  return request("/health");
}
