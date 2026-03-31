import React, { useEffect, useState } from "react";

function Chatbot() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your Safety Assistant. Ask me anything about travel safety.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState("");
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError("");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Enable it to find nearby places.");
        } else {
          setLocationError("Unable to fetch your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const currentMessage = message;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: currentMessage },
    ]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          location: coords,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply || "Sorry, I could not generate a response.",
          places: Array.isArray(data.places) ? data.places : null,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: error.message || "Sorry, I could not respond right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="w-full section-card p-5 lg:-mt-1 border border-sky-100">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title font-bold text-lg">
        🤖 AI Safety Chatbot
        </h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
          Live AI
        </span>
      </div>

      {locationError && (
        <div className="mb-3 text-sm text-red-600">{locationError}</div>
      )}

      <div className="h-[390px] overflow-y-auto border border-slate-200 rounded-2xl p-4 mb-4 bg-white/80">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-3 rounded-2xl max-w-[80%] whitespace-pre-wrap leading-relaxed ${
                msg.sender === "user"
                  ? "bg-emerald-100 text-slate-900"
                  : "bg-sky-50 text-slate-900"
              }`}
            >
              {msg.text}
              {Array.isArray(msg.places) && msg.places.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {msg.places.map((place, placeIndex) => {
                    const hasCoords = place.coordinates?.lat && place.coordinates?.lng;
                    const destination = hasCoords
                      ? `${place.coordinates.lat},${place.coordinates.lng}`
                      : encodeURIComponent(place.address || place.name);
                    const directionsUrl = hasCoords
                      ? `https://www.google.com/maps/dir/?api=1&destination=${destination}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

                    return (
                      <div
                        key={`${place.name}-${placeIndex}`}
                        className="rounded-xl border border-emerald-100 bg-white/90 px-3 py-2"
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {place.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {place.address}
                        </div>
                        {typeof place.distanceKm === "number" && (
                          <div className="text-xs text-gray-500">
                            {place.distanceKm.toFixed(1)} km away
                          </div>
                        )}
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Directions
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mb-3 flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-amber-50 text-slate-900">
              Typing...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Ask about travel safety..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-6 py-3 btn-accent hover:brightness-110 transition disabled:opacity-70"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;