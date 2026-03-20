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

  const handlePanic = useCallback(async () => {
    console.log("🔴 Panic button clicked or voice command detected!");

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
        phone: c.contact,
        relation: c.relation,
      })
    );

    const panicPayload = {
      email : localStorage.getItem("email") || "",
      name: parsedIdData.name,
      contact_number: parsedIdData.contactInfo,
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

      if (response.ok) {
        console.log("🚨 Panic data sent successfully!");
        alert("🚨 Panic alert sent successfully!");
      } else {
        const errData = await response.json().catch(() => null);
        console.error("❌ Failed to send panic data:", errData || response.status);
        alert("❌ Failed to send panic alert. Please try again.");
      }
    } catch (err) {
      console.error("⚠️ Error sending panic data:", err);
      alert("⚠️ Error sending panic alert: " + err.message);
    }
  }, [currentLocation, navigate]);

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
            handlePanic();
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
