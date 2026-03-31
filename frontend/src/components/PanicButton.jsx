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
  const [lastPanicRequest, setLastPanicRequest] = useState(() => {
    try {
      const raw = localStorage.getItem("lastPanicRequest");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

 const capturePanicPhotos = useCallback(async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    pushNotification("Camera not supported in this browser.", "warning");
    console.error("Camera API not supported in this browser.");
    return [];
  }

  try {
    console.log("Opening camera for panic photos...");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    console.log("Camera stream started.");

    if (!videoRef.current) return [];

    videoRef.current.srcObject = stream;

    // Wait for metadata + ensure video actually starts
    await new Promise((resolve) => {
      videoRef.current.onloadedmetadata = () => resolve();
    });

    await videoRef.current.play();
    console.log("Camera video playback started.");

    // 🔥 CRITICAL FIX: wait for frames to be ready
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = document.createElement("canvas");
    const video = videoRef.current;

    // 🔥 FIX: ensure valid dimensions
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    const photos = [];

    for (let i = 0; i < 3; i++) {
      ctx.drawImage(video, 0, 0, width, height);
      photos.push(canvas.toDataURL("image/jpeg", 0.8));
      console.log(`Captured panic photo ${i + 1}/3`);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    console.log("Finished capturing panic photos.");
    return photos;
  } catch (err) {
    console.error("Camera capture error:", err);
    pushNotification("Could not access camera.", "warning");
    return [];
  } finally {
    // 🔥 safer cleanup
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }
}, [pushNotification]);

  const handlePanic = useCallback(async (voiceQueryOrEvent) => {
    console.log("🔴 Panic button clicked or voice command detected!");
    console.log("🔴 Voice query:", voiceQueryOrEvent);

    const voiceQuery = typeof voiceQueryOrEvent === "string" ? voiceQueryOrEvent : "";
    const finalQuery = String(panicQuery || voiceQuery || transcript || "").trim();

    console.log("🔴 Final query:", finalQuery);
    console.log("🔴 Current location:", currentLocation);

    setIsSending(true);
    setTimeout(() => setIsSending(false), 4000);

    const capturedPhotos = voiceQuery ? [] : await capturePanicPhotos();
    console.log("📸 Captured photos:", capturedPhotos.length);

    const digitalIdData = localStorage.getItem("digitalIdData");
    console.log("💾 Raw digitalIdData from localStorage:", digitalIdData);

    if (!digitalIdData) {
      console.error("❌ No digitalIdData found in localStorage!");
      alert("⚠️ create your Digital ID to access Panic Button");
      console.warn("⚠️ No digitalIdData found, redirecting...");
      navigate("/Profile");
      return;
    }

    const parsedIdData = JSON.parse(digitalIdData);
    console.log("👤 Parsed digital ID data:", parsedIdData);

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

    const panicRequestId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    console.log("👥 Transformed emergency contacts:", transformedContacts);

    const panicPayload = {
      panic_request_id: panicRequestId,
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
    console.log("🔑 Checking token...");

    const token = localStorage.getItem("token");
    console.log("🔑 Token exists:", !!token);
    console.log("🔑 Token value:", token ? token.substring(0, 20) + "..." : "null");

    try {
      if (capturedPhotos.length > 0) {
        try {
          const photoResponse = await fetch(`${API_BASE_URL}/api/digitalid/panic-photos`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              panic_request_id: panicRequestId,
              email: panicPayload.email,
              contact_number: panicPayload.contact_number,
              panic_photos: capturedPhotos,
            }),
          });

          const photoResult = await photoResponse.json().catch(() => ({}));
          if (!photoResponse.ok) {
            console.error("❌ Failed to save panic photos:", photoResult || photoResponse.status);
            pushNotification("Failed to save panic photos.", "error");
          } else if (photoResult?.photoUrls?.length) {
            console.log("Panic photo URLs:", photoResult.photoUrls);
          }
        } catch (photoError) {
          console.error("❌ Panic photo upload error:", photoError);
          pushNotification("Panic photo upload error.", "error");
        }
      }

      if (!token) {
        console.error("❌ No token found in localStorage!");
        pushNotification("Please login to send panic request.", "warning");
        return;
      }

      console.log("🔑 Token found, proceeding with panic request...");
      console.log("📡 Making fetch request to:", `${API_BASE_URL}/api/digitalid/panic`);
      console.log("📡 Request headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.substring(0, 20)}...`,
      });

      const response = await fetch(`${API_BASE_URL}/api/digitalid/panic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,   // 🔑 attach token here
        },
        body: JSON.stringify(panicPayload),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      const result = await response.json().catch(() => ({}));
      console.log("📡 Response body:", result);

      if (response.ok) {
        console.log("🚨 Panic data sent successfully!");
        pushNotification("Panic request sent.", "success");
        setPanicQuery("");

        const savedPanic = result?.data;
        if (savedPanic?.panic_request_id) {
          const locationText = (savedPanic.locations || [])
            .map((loc) => loc.detailed_address || [loc.city, loc.state].filter(Boolean).join(", "))
            .filter(Boolean)
            .join("; ");

          const panicMeta = {
            panicRequestId: savedPanic.panic_request_id,
            panicQuery: savedPanic.panic_query || "",
            createdAt: savedPanic.createdAt || new Date().toISOString(),
            location: locationText,
          };

          setLastPanicRequest(panicMeta);
          localStorage.setItem("lastPanicRequest", JSON.stringify(panicMeta));
        }

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
  }, [capturePanicPhotos, currentLocation, navigate, panicQuery, pushNotification, transcript]);

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

  const handleShareLastPanic = async () => {
    if (!lastPanicRequest) {
      pushNotification("No panic request available to share.", "warning");
      return;
    }

    const message = [
      "PANIC ALERT DETAILS",
      `Request ID: ${lastPanicRequest.panicRequestId}`,
      `Created: ${new Date(lastPanicRequest.createdAt).toLocaleString()}`,
      lastPanicRequest.panicQuery ? `Issue: ${lastPanicRequest.panicQuery}` : null,
      lastPanicRequest.location ? `Location: ${lastPanicRequest.location}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Panic Request",
          text: message,
        });
        pushNotification("Panic details shared.", "success");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        pushNotification("Panic details copied to clipboard.", "success");
        return;
      }

      pushNotification("Share is not supported on this browser.", "warning");
    } catch (error) {
      console.error("Share panic error:", error);
      pushNotification("Failed to share panic details.", "error");
    }
  };

  const handleDeleteLastPanic = async () => {
    if (!lastPanicRequest?.panicRequestId) {
      pushNotification("No panic request available to delete.", "warning");
      return;
    }

    const confirmed = window.confirm(
      "Delete your last panic request? This will also remove linked panic photos."
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      pushNotification("Please login to delete panic request.", "warning");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/digitalid/panic/${encodeURIComponent(lastPanicRequest.panicRequestId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        pushNotification(result.error || "Failed to delete panic request.", "error");
        return;
      }

      localStorage.removeItem("lastPanicRequest");
      setLastPanicRequest(null);
      pushNotification("Panic request deleted.", "success");
    } catch (error) {
      console.error("Delete panic error:", error);
      pushNotification("Error deleting panic request.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-4 items-start">
      <video ref={videoRef} className="hidden" playsInline muted />
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
        {/* Test Panic Button - Simple version for debugging */}
        <motion.button
          onClick={async () => {
            console.log("🧪 Testing simple panic request...");
            const token = localStorage.getItem("token");
            const email = localStorage.getItem("email");

            if (!token || !email) {
              console.error("❌ Missing token or email");
              return;
            }

            try {
              const testPayload = {
                email: email,
                name: "Test User",
                contact_number: "+919876543210",
                panic_query: "Test panic from frontend",
                kyc: { aadhaar: { number: null }, passport: { number: null, country: null } },
                emergency_contacts: [],
                locations: []
              };

              console.log("📦 Test payload:", testPayload);

              const response = await fetch(`${API_BASE_URL}/api/digitalid/panic`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(testPayload),
              });

              const result = await response.json();
              console.log("📡 Test response:", response.status, result);

              if (response.ok) {
                console.log("✅ Test panic saved successfully!");
              } else {
                console.error("❌ Test panic failed:", result);
              }
            } catch (error) {
              console.error("❌ Test panic error:", error);
            }
          }}
          className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600"
        >
          ✅ WORKING
        </motion.button>

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

      {lastPanicRequest && (
        <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">Last Panic Request</p>
          <p className="mt-1 text-xs text-gray-600">
            ID: {lastPanicRequest.panicRequestId}
          </p>
          <p className="text-xs text-gray-600">
            Created: {new Date(lastPanicRequest.createdAt).toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={handleShareLastPanic}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              Share Panic
            </button>
            <button
              onClick={handleDeleteLastPanic}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
            >
              Delete Panic Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanicButton;
