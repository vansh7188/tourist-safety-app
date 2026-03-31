// digitalidform.js

import express from "express";
import mongoose from "mongoose";
import twilio from "twilio";
import nodemailer from "nodemailer";
import Panic from "./models/panic.js";
import PanicMedia from "./models/panicMedia.js";
import { v2 as cloudinary } from "cloudinary";
// --- Schemas (Exported so index.js can use them) ---

const emergencyContactSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: [true, "Emergency contact name is required"],
    match: [/^[A-Za-z\s]+$/, "Name must contain only letters"],
  },
  email: {
    type: String,
    required: [true, "Emergency contact email is required"],
    match: [/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, "Invalid email address"],
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

  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

  if (cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  const twilioClient =
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;

  const twilioFrom = process.env.TWILIO_FROM_NUMBER || "";
  const verifiedRecipients = (process.env.TWILIO_VERIFIED_NUMBERS || "")
    .split(",")
    .map((num) => num.trim())
    .filter(Boolean);

  const mailTransporter =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
      : null;

  const mailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || "";

  // --- Routes (now attached to the router) ---

  // 🔍 Health check endpoint
  router.get("/health", async (req, res) => {
    return res.status(200).json({
      status: "ok",
      message: "Panic API is reachable",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  });

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

  router.put("/digital-id", async (req, res) => {
    try {
      const email = req.user?.email || req.body.email;
      if (!email) {
        return res.status(400).json({ error: "Email is required to update digital ID" });
      }

      const updated = await DigitalId.findOneAndUpdate(
        { email },
        { ...req.body, email },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Digital ID not found" });
      }

      return res.json({ message: "Digital ID updated successfully", data: updated });
    } catch (error) {
      return res.status(400).json({ error: error.message });
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

router.post("/panic-photos", async (req, res) => {
  try {
    const email = req.user?.email || req.body.email;
    const contactNumber = req.body.contact_number || req.body.contactNumber;
    const panicRequestId = req.body.panic_request_id || req.body.panicRequestId;
    const incomingPhotos = Array.isArray(req.body.panic_photos)
      ? req.body.panic_photos.filter(Boolean).slice(0, 3)
      : [];

    if (!email || !contactNumber || !panicRequestId) {
      return res.status(400).json({
        error: "Email, contact number, and panic_request_id are required",
      });
    }

    if (!cloudinaryConfigured) {
      return res.status(500).json({ error: "Cloudinary not configured" });
    }

    if (incomingPhotos.length === 0) {
      return res.status(400).json({ error: "No photos provided" });
    }

    const isDataUrl = (value) => typeof value === "string" && value.startsWith("data:");

    let photoUrls = [];
    if (incomingPhotos.length > 0) {
      const invalidPhotos = incomingPhotos.filter((photo) => !isDataUrl(photo));
      if (invalidPhotos.length > 0) {
        return res.status(400).json({ error: "Invalid photo data" });
      }

      const uploadResults = await Promise.all(
        incomingPhotos.map((photo) =>
          cloudinary.uploader.upload(photo, {
            folder: "panic_photos",
            resource_type: "image",
          })
        )
      );

      photoUrls = uploadResults.map((r) => r.secure_url).filter(Boolean);
    }

    const mediaRecord = new PanicMedia({
      panic_request_id: panicRequestId,
      email,
      contact_number: contactNumber,
      photo_urls: photoUrls,
    });

    await mediaRecord.save();

    return res.status(201).json({
      message: "Photos saved",
      photoUrls,
      data: mediaRecord,
    });
  } catch (error) {
    console.error("Error saving panic photos:", error);
    return res.status(500).json({ message: "Failed to save photos", error });
  }
});

// 🔍 Get panic photos (by panic_request_id, optionally by email)
router.get("/panic-photos", async (req, res) => {
  try {
    const panicRequestId = req.query.panic_request_id || req.query.panicRequestId;
    const email = req.query.email || req.user?.email;
    const filter = {};
    if (panicRequestId) {
      filter.panic_request_id = panicRequestId;
    } else if (email) {
      filter.email = email;
    }
    const photos = await PanicMedia.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({
      count: photos.length,
      data: photos,
    });
  } catch (error) {
    console.error("Error fetching panic photos:", error);
    return res.status(500).json({ message: "Failed to fetch photos", error });
  }
});

router.post("/panic", async (req, res) => {
  try {
    console.log("🚨 [PANIC ENDPOINT] Received panic request from:", req.user?.email || req.body.email);
    console.log("🚨 [PANIC ENDPOINT] Request body:", JSON.stringify(req.body, null, 2));
    
    const panicData = { ...req.body, email: req.user?.email || req.body.email };
    delete panicData.panic_photos;

    const digitalIdSnapshot = {
      name: panicData.name || "",
      contact: panicData.contact_number || "",
      kycType: panicData.kyc?.passport?.number ? "passport" : "aadhaar",
      passportNumber: panicData.kyc?.passport?.number || "",
      passportCountry: panicData.kyc?.passport?.country || "",
    };

    const locationSummary = (panicData.locations || [])
      .map((loc) => loc.detailed_address || loc.city || loc.state || "")
      .filter(Boolean)
      .join("; ");

    const smsBody =
      "PANIC ALERT\n" +
      `Name: ${digitalIdSnapshot.name}\n` +
      `Contact: ${digitalIdSnapshot.contact}\n` +
      `Email: ${panicData.email || ""}\n` +
      `KYC: ${digitalIdSnapshot.kycType}` +
      (digitalIdSnapshot.kycType === "passport"
        ? ` (${digitalIdSnapshot.passportCountry} - ${digitalIdSnapshot.passportNumber})`
        : "") +
      (panicData.panic_query ? `\nIssue: ${panicData.panic_query}` : "") +
      (locationSummary ? `\nLocation: ${locationSummary}` : "");

    // Create new panic record
    console.log("🚨 [PANIC ENDPOINT] Saving panic record to MongoDB...");
    const newPanic = new Panic(panicData);
    const savedPanic = await newPanic.save();
    console.log("✅ [PANIC ENDPOINT] Panic record saved with ID:", savedPanic._id);

    console.log("Twilio configured:", Boolean(twilioClient));
    console.log("TWILIO_FROM_NUMBER:", twilioFrom || "(missing)");
    console.log(
      "TWILIO_ACCOUNT_SID set:",
      Boolean(process.env.TWILIO_ACCOUNT_SID)
    );
    console.log(
      "TWILIO_AUTH_TOKEN set:",
      Boolean(process.env.TWILIO_AUTH_TOKEN)
    );

    const smsRecipients = (panicData.emergency_contacts || [])
      .map((c) => c.contact || c.phone)
      .filter(Boolean);

    const emailRecipients = (panicData.emergency_contacts || [])
      .map((c) => c.email)
      .filter(Boolean);

    console.log("Raw recipients:", smsRecipients);
    console.log("Email recipients:", emailRecipients);

    const invalidRecipients = smsRecipients.filter(
      (phone) => !/^\+\d{10,15}$/.test(phone)
    );
    if (invalidRecipients.length > 0) {
      console.warn("Invalid E.164 recipients:", invalidRecipients);
    }
    let smsStatus = "not_configured";
    if (!twilioClient || !twilioFrom) {
      smsStatus = "not_configured";
    } else if (smsRecipients.length === 0) {
      smsStatus = "no_recipients";
    } else {
      try {
        const results = await Promise.all(
          smsRecipients.map((to) =>
            twilioClient.messages.create({
              to,
              from: twilioFrom,
              body: smsBody,
            })
          )
        );
        console.log(
          "Twilio SMS sent:",
          results.map((r) => ({ sid: r.sid, to: r.to, status: r.status }))
        );
        smsStatus = "sent";
      } catch (smsError) {
        console.error("Twilio SMS error:", smsError);
        smsStatus = "failed";
      }
    }

    const emailBody =
      "PANIC ALERT\n\n" +
      "Your relative/friend is in danger.\n" +
      "We are from Safe_Travel and your relative/friend just clicked the panic button.\n" +
      "Please try to contact them immediately.\n\n" +
      `User: ${digitalIdSnapshot.name}\n` +
      `Contact: ${digitalIdSnapshot.contact}\n` +
      `Email: ${panicData.email || ""}\n` +
      `KYC: ${digitalIdSnapshot.kycType}` +
      (digitalIdSnapshot.kycType === "passport"
        ? ` (${digitalIdSnapshot.passportCountry} - ${digitalIdSnapshot.passportNumber})`
        : "") +
      (panicData.panic_query ? `\nIssue: ${panicData.panic_query}` : "") +
      (locationSummary ? `\nLocation: ${locationSummary}` : "") +
      "\n\nDigital ID Summary:\n" +
      `Name: ${digitalIdSnapshot.name}\n` +
      `Contact: ${digitalIdSnapshot.contact}\n` +
      `Email: ${panicData.email || ""}\n` +
      `KYC: ${digitalIdSnapshot.kycType}` +
      (digitalIdSnapshot.kycType === "passport"
        ? ` (${digitalIdSnapshot.passportCountry} - ${digitalIdSnapshot.passportNumber})`
        : "");

    let emailStatus = "not_configured";
    if (!mailTransporter || !mailFrom) {
      emailStatus = "not_configured";
    } else if (emailRecipients.length === 0) {
      emailStatus = "no_recipients";
    } else {
      try {
        const mailResults = await Promise.all(
          emailRecipients.map((to) =>
            mailTransporter.sendMail({
              from: mailFrom,
              to,
              subject: "Panic Alert: User in danger",
              text: emailBody,
            })
          )
        );
        console.log(
          "Email sent:",
          mailResults.map((r) => ({
            messageId: r.messageId,
            to: r.accepted,
          }))
        );
        emailStatus = "sent";
      } catch (emailError) {
        console.error("Email send error:", emailError);
        emailStatus = "failed";
      }
    }

    return res.status(201).json({
      message: "Panic saved",
      smsStatus,
      emailStatus,
      data: newPanic,
    });
  } catch (error) {
    console.error("Error saving panic data:", error);
    return res.status(500).json({ message: "Failed to process panic", error });
  }
});

// 🔍 Get all panic requests (for debugging/admin)
router.get("/panic", async (req, res) => {
  try {
    console.log("📊 Fetching all panic requests...");
    const allPanics = await Panic.find().sort({ createdAt: -1 }).limit(50);
    console.log(`✅ Found ${allPanics.length} panic records`);
    return res.status(200).json({
      count: allPanics.length,
      data: allPanics,
    });
  } catch (error) {
    console.error("Error fetching panic data:", error);
    return res.status(500).json({ message: "Failed to fetch panic data", error });
  }
});

// 🔍 Get panic requests by email
router.get("/panic/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("📊 Fetching panic requests for email:", email);
    const userPanics = await Panic.find({ email }).sort({ createdAt: -1 });
    console.log(`✅ Found ${userPanics.length} panic records for ${email}`);
    return res.status(200).json({
      email,
      count: userPanics.length,
      data: userPanics,
    });
  } catch (error) {
    console.error("Error fetching panic data by email:", error);
    return res.status(500).json({ message: "Failed to fetch panic data", error });
  }
});

// Delete a specific panic request for the logged-in user
router.delete("/panic/:panicRequestId", async (req, res) => {
  try {
    const { panicRequestId } = req.params;
    const requesterEmail = req.user?.email;

    if (!requesterEmail) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!panicRequestId) {
      return res.status(400).json({ error: "panicRequestId is required" });
    }

    const deletedPanic = await Panic.findOneAndDelete({
      panic_request_id: panicRequestId,
      email: requesterEmail,
    });

    if (!deletedPanic) {
      return res.status(404).json({ error: "Panic request not found" });
    }

    const mediaDeleteResult = await PanicMedia.deleteMany({
      panic_request_id: panicRequestId,
      email: requesterEmail,
    });

    return res.status(200).json({
      message: "Panic request deleted successfully",
      deletedPanicId: deletedPanic._id,
      deletedMediaCount: mediaDeleteResult.deletedCount || 0,
    });
  } catch (error) {
    console.error("Error deleting panic request:", error);
    return res.status(500).json({ message: "Failed to delete panic request", error });
  }
});

  return router;
}

// Export the schemas for use in the main file
export { emergencyContactSchema, digitalIdSchema };