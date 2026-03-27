import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

import { Profile } from "./models/Profile.js";
import {
  createDigitalIdRouter,
  digitalIdSchema,
} from "./DigitalidForm.js";

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const validatePlacesApiKey = async () => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("⚠️ GOOGLE_MAPS_API_KEY missing. Nearby place search will fail.");
    return;
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.id",
      },
      body: JSON.stringify({
        textQuery: "police station",
        maxResultCount: 1,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn(
        "⚠️ Places API (New) check failed:",
        data.error?.message || res.statusText
      );
    } else {
      console.log("✅ Places API (New) check ok");
    }
  } catch (err) {
    console.warn("⚠️ Places API (New) check error:", err.message);
  }
};

const haversineKm = (a, b) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const getNearbyPlaces = async (location, category) => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY missing in .env");
  }

  const { lat, lng } = location;
  const radiusMeters = 3000;
  const fieldMask = "places.displayName,places.formattedAddress,places.location";

  const searchNearby = async (includedTypes, keyword) => {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to fetch nearby places");
    }

    let places = data.places || [];
    if (keyword) {
      const lower = keyword.toLowerCase();
      places = places.filter((place) =>
        place.displayName?.text?.toLowerCase().includes(lower)
      );
    }

    return places;
  };

  const searchText = async (textQuery) => {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 10,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to fetch nearby places");
    }

    return data.places || [];
  };

  let places = [];
  if (category === "police") {
    places = await searchNearby(["police"]);
  } else if (category === "hospital") {
    places = await searchNearby(["hospital"]);
  } else if (category === "hotel") {
    places = await searchNearby(["lodging"], "hotel");
  } else if (category === "hostel") {
    places = await searchNearby(["lodging"], "hostel");
  } else if (category === "highway") {
    places = await searchText("highway near me");
  } else {
    places = await searchText(`${category} near me`);
  }

  const results = places.slice(0, 3).map((place) => {
    const placeLoc = place.location;
    const distanceKm = placeLoc
      ? haversineKm(
          { lat, lng },
          { lat: placeLoc.latitude, lng: placeLoc.longitude }
        )
      : null;
    return {
      name: place.displayName?.text || "Unknown",
      address: place.formattedAddress || "Address unavailable",
      distanceKm,
    };
  });

  return results;
};

// ----------------- Middleware -----------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://tourist-safety-app-one.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json({ limit: "25mb" }));

// ----------------- MongoDB connections -----------------
mongoose
  .connect(process.env.MONGO_URI2)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const digitalIdConnection = mongoose.createConnection(process.env.MONGO_URI2);

digitalIdConnection.on("connected", () => {
  console.log("✅ MongoDB (Digital ID DB) connected");
});

digitalIdConnection.on("error", (err) => {
  console.error("❌ MongoDB (Digital ID DB) error:", err);
});

const DigitalId = digitalIdConnection.model("DigitalId", digitalIdSchema);

// ----------------- User Schema -----------------
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// ----------------- Auth Middleware -----------------
const authMiddleware = (req, res, next) => {
  if (req.baseUrl === "/api/digitalid" && req.path === "/panic-photos") {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ----------------- Rate Limiter -----------------
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: "Too many requests, please try again after 5 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ----------------- Basic Route -----------------
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

// ----------------- Signup Route -----------------
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "Signup successful!" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------- Login Route -----------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------- Profile Route (Protected) -----------------
app.post("/profile", authMiddleware, async (req, res) => {
  const { name, contact, altContact, gender, age } = req.body;
  const email = req.user.email;

  if (age < 18) {
    return res.status(400).json({ error: "Age must be 18 or above" });
  }

  try {
    let profile = await Profile.findOne({ email });

    if (profile) {
      profile.name = name;
      profile.contact = contact;
      profile.altContact = altContact;
      profile.gender = gender;
      profile.age = age;
      await profile.save();
    } else {
      profile = new Profile({
        name,
        email,
        contact,
        altContact,
        gender,
        age,
      });
      await profile.save();
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(400).json({ error: err.message });
  }
});

// ----------------- AI Chatbot Route (NO AUTH) -----------------
app.post("/api/chat", async (req, res) => {
  try {
    console.log("✅ Chat route hit");
    console.log("Body:", req.body);

    const { message, location } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing in .env" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const normalized = message.toLowerCase();
    const nearbyMatch = normalized.match(
      /(nearest|nearby)\s+(police|police station|hospital|hotel|hostel|highway|roads|road|highways)/
    );

    if (nearbyMatch) {
      if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
        return res.status(200).json({
          reply:
            "Please enable location access so I can find nearby places for you.",
        });
      }

      const rawCategory = nearbyMatch[2]
        .replace("police station", "police")
        .replace("highways", "highway")
        .replace("roads", "road")
        .replace("road", "highway");

      const places = await getNearbyPlaces(location, rawCategory);

      if (!places.length) {
        return res.status(200).json({
          reply: "I could not find nearby places for that request. Try a different query.",
        });
      }

      const lines = places.map((place, index) => {
        const distance = place.distanceKm
          ? ` (${place.distanceKm.toFixed(1)} km)`
          : "";
        return `${index + 1}. ${place.name}${distance} - ${place.address}`;
      });

      return res.status(200).json({
        reply: `Here are the closest options I found:\n${lines.join("\n")}`,
      });
    }

    const prompt = `
You are an AI safety assistant inside a tourist safety app.

Rules:
- Reply briefly and clearly
- Give practical travel safety advice
- Focus on emergencies, suspicious situations, safe travel, safe routes, location sharing, and trusted contacts
- Keep the tone calm
- Do not give illegal or dangerous advice

User message: ${message}
User location (if available): ${location?.lat || "N/A"}, ${location?.lng || "N/A"}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("✅ Gemini response received");

    const reply =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response right now.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ Gemini chatbot error:", err);
    res.status(500).json({
      error: err.message || "Failed to get AI response",
    });
  }
});

// ----------------- Digital ID Route (Protected) -----------------
const digitalIdRouter = createDigitalIdRouter(DigitalId);
app.use("/api/digitalid", authMiddleware, digitalIdRouter);

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  validatePlacesApiKey();
});