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
    <div className="w-full bg-white rounded-2xl shadow-xl border border-blue-200 p-6">
      <h2 className="text-blue-700 font-bold mb-4 text-lg">
        🤖 AI Safety Chatbot
      </h2>

      {locationError && (
        <div className="mb-3 text-sm text-red-600">{locationError}</div>
      )}

      <div className="h-[350px] overflow-y-auto border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
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
                  ? "bg-blue-100 text-gray-900"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mb-3 flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-gray-200 text-gray-900">
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
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-70"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;