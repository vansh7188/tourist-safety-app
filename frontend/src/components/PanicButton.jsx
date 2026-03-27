// src/components/PanicButton.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function PanicButton({ currentLocation }) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [panicQuery, setPanicQuery] = useState("");

  const pushNotification = useCallback((message, tone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotifications((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const transformLocation = (loc) => {
    if (!loc) return null;
    return {
      coordinates: {
        type: "Point",
        coordinates: [loc.longitude, loc.latitude], // [lon, lat]
      },
      state: loc.state || "",
      city: loc.city || "",
      district: loc.district || "",
      place_id: loc.placeId || "",
      type: loc.type || "current",
      detailed_address: loc.displayName || "",
      postcode: loc.postcode || "",
    };
  };

  const handlePanic = useCallback(async (voiceQuery) => {
    console.log("🔴 Panic button clicked or voice command detected!");

    const finalQuery = (panicQuery || voiceQuery || transcript).trim();

    setIsSending(true);
    setTimeout(() => setIsSending(false), 4000);

    const digitalIdData = localStorage.getItem("digitalIdData");
    if (!digitalIdData) {
      alert("⚠️ create your Digital ID to access Panic Button");
      console.warn("⚠️ No digitalIdData found, redirecting...");
      navigate("/Profile");
      return;
    }

    const parsedIdData = JSON.parse(digitalIdData);
    console.log("👤 Digital ID data:", parsedIdData);

    const transformedLocation = transformLocation(currentLocation);
    console.log("📍 Transformed location:", transformedLocation);

    const transformedContacts = (parsedIdData.emergencyContacts || []).map(
      (c) => ({
        name: c.name,
        email: c.email,
        phone: c.contact,
        relation: c.relation,
      })
    );

    const panicPayload = {
      email : localStorage.getItem("email") || "",
      name: parsedIdData.name,
      contact_number: parsedIdData.contactInfo,
      panic_query: finalQuery,
      kyc: {
        aadhaar: { number: parsedIdData.aadhaarNumber || null },
        passport: {
          number: parsedIdData.passportNumber || null,
          country: parsedIdData.passportCountry || null,
        },
      },
      emergency_contacts: transformedContacts,
      locations: transformedLocation ? [transformedLocation] : [],
    };

    console.log("📦 Final panicPayload:", panicPayload);
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE_URL}/api/digitalid/panic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,   // 🔑 attach token here
        },
        body: JSON.stringify(panicPayload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log("🚨 Panic data sent successfully!");
        pushNotification("Panic request sent.", "success");
        setPanicQuery("");

        const smsStatus = result?.smsStatus;
        if (smsStatus === "sent") {
          pushNotification("SMS sent to emergency contacts.", "success");
        } else if (smsStatus === "failed") {
          pushNotification("SMS could not be sent.", "error");
        } else if (smsStatus === "no_recipients") {
          pushNotification("No emergency contacts to notify by SMS.", "warning");
        } else if (smsStatus === "not_configured") {
          pushNotification("SMS service not configured.", "warning");
        }

        const emailStatus = result?.emailStatus;
        if (emailStatus === "sent") {
          pushNotification("Email sent to emergency contacts.", "success");
        } else if (emailStatus === "failed") {
          pushNotification("Email could not be sent.", "error");
        } else if (emailStatus === "no_recipients") {
          pushNotification("No emergency contacts to notify by email.", "warning");
        } else if (emailStatus === "not_configured") {
          pushNotification("Email service not configured.", "warning");
        }
      } else {
        console.error("❌ Failed to send panic data:", result || response.status);
        pushNotification("Failed to send panic request.", "error");
      }
    } catch (err) {
      console.error("⚠️ Error sending panic data:", err);
      pushNotification(`Error sending panic request: ${err.message}`, "error");
    }
  }, [currentLocation, navigate, panicQuery, pushNotification, transcript]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      console.warn("⚠️ Speech Recognition API not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          setTranscript(transcriptSegment);
          // Check if user said "panic" or "help"
          const lowerTranscript = transcriptSegment.toLowerCase().trim();
          if (
            lowerTranscript.includes("panic") ||
            lowerTranscript.includes("help")
          ) {
            console.log("🎙️ Voice command detected:", transcriptSegment);
            // Trigger panic alert
            handlePanic(transcriptSegment);
          }
        } else {
          interimTranscript += transcriptSegment;
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("❌ Speech Recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [handlePanic]);

  const handleVoiceButton = () => {
    if (!recognitionRef.current) {
      alert("⚠️ Voice recognition not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col gap-4 items-start">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg px-4 py-3 shadow-lg text-sm font-semibold text-white ${
                n.tone === "success"
                  ? "bg-green-600"
                  : n.tone === "error"
                  ? "bg-red-600"
                  : "bg-amber-500"
              }`}
            >
              {n.message}
            </div>
          ))}
        </div>
      )}

      {/* Loading overlay */}
      {isSending && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl px-6 py-5 shadow-xl flex items-center gap-4">
            <div className="h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-800">
              Sending panic request to police and your emergency contacts...
            </p>
          </div>
        </div>
      )}
      <input
        type="text"
        value={panicQuery}
        onChange={(e) => setPanicQuery(e.target.value)}
        placeholder="Optional: describe your emergency"
        className="w-full max-w-xl px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-300"
      />

      <div className="flex gap-4 items-center">
        {/* Panic Button */}
        <motion.button
          onClick={handlePanic}
          className="px-8 py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg"
          whileHover={{
            scale: 1.1,
            boxShadow: "0 0 20px 5px rgba(255,0,0,0.8)",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          PANIC
        </motion.button>

        {/* Voice Button */}
        {voiceSupported && (
          <motion.button
            onClick={handleVoiceButton}
            className={`px-8 py-4 font-bold rounded-xl shadow-lg transition-all ${
              isListening
                ? "bg-blue-600 animate-pulse"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
            whileHover={{
              scale: isListening ? 1 : 1.1,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200 }}
            title={isListening ? "Listening... Say 'panic' or 'help'" : "Click to start voice command"}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">🎙️</span>
              <span>{isListening ? "LISTENING..." : "VOICE"}</span>
            </span>
          </motion.button>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-700 bg-gray-100 px-4 py-2 rounded-lg"
        >
          Heard: "{transcript}"
        </motion.div>
      )}
    </div>
  );
}

export default PanicButton;
