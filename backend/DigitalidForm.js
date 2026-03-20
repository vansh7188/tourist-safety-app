// digitalidform.js

import express from "express";
import mongoose from "mongoose";
import Panic from "./models/panic.js";
// --- Schemas (Exported so index.js can use them) ---

const emergencyContactSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: [true, "Emergency contact name is required"],
    match: [/^[A-Za-z\s]+$/, "Name must contain only letters"],
  },
  contact: {
    type: String,
    required: [true, "Emergency contact number is required"],
    match: [/^\d+$/, "Contact must be numeric"],
  },
  relation: {
    type: String,
    required: [true, "Relation is required"],
    match: [/^[A-Za-z\s]+$/, "Relation must be a string"],
  },
});

const digitalIdSchema = new mongoose.Schema({
  email: {
  type: String,
  required: true,
  match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
},

  name: {
    type: String,
    required: [true, "Full name is required"],
    match: [/^[A-Za-z\s]+$/, "Name must contain only letters"],
  },
  contactInfo: {
    type: String,
    required: [true, "Contact info is required"],
    match: [/^\d+$/, "Contact info must be numeric"],
  },
  kyc: {
    type: String,
    enum: ["aadhaar", "passport"],
    required: true,
  },
  aadhaarNumber: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.kyc === "aadhaar") return /^\d{12}$/.test(v);
        return true;
      },
      message: "Aadhaar must be a 12-digit number",
    },
  },
  passportCountry: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.kyc === "passport") return /^[A-Za-z\s]+$/.test(v);
        return true;
      },
      message: "Country must contain only letters",
    },
  },
  passportNumber: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.kyc === "passport") return /^[A-Za-z0-9]+$/.test(v);
        return true;
      },
      message: "Passport number must be alphanumeric",
    },
  },
  emergencyContacts: [emergencyContactSchema],
});

// This function creates and returns the router.
// It takes the 'DigitalId' model as a dependency.
export function createDigitalIdRouter(DigitalId) {
  const router = express.Router();

  // --- Routes (now attached to the router) ---

  router.post("/digital-id", async (req, res) => {
    try {
      const newId = new DigitalId(req.body);
      await newId.save();
      res.status(201).json({ message: "✅ Digital ID saved", data: newId });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/digital-id", async (req, res) => {
    try {
      const { email } = req.query;
      let ids;
      if (email) {
        ids = await DigitalId.find({ email });
      } else {
        ids = await DigitalId.find();
      }
      res.json(ids);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

 router.delete("/digital-id", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required to delete digital ID" });
  }
  try {
    // Use the injected model 'DigitalId' instead of 'DigitalIdModel'
    const deleted = await DigitalId.findOneAndDelete({ email: email });
    if (!deleted) {
      return res.status(404).json({ error: "Digital ID not found" });
    }
    return res.json({ message: "Digital ID deleted successfully" });
  } catch (err) {
    console.error("Error deleting digital ID:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/panic", async (req, res) => {
  try {
    const panicData = req.body;

    // Create new panic record
    const newPanic = new Panic(panicData);
    await newPanic.save();

    res.status(201).json({ message: "Panic data stored successfully", data: newPanic });
  } catch (error) {
    console.error("Error saving panic data:", error);
    res.status(500).json({ message: "Failed to save panic data", error });
  }
});

  return router;
}

// Export the schemas for use in the main file
export { emergencyContactSchema, digitalIdSchema };