import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import multer from "multer";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export function createEmergencyRouter({
  EmergencyPost,
  Profile,
  Message,
  emitToUser = () => {},
  joinUserToRoom = () => {},
}) {
  const router = express.Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 4,
    },
    fileFilter: (req, file, callback) => {
      if (/^(image|video)\//.test(file.mimetype)) {
        return callback(null, true);
      }
      return callback(new Error("Only image and video files are allowed"));
    },
  });

  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  );

  if (cloudinaryConfigured) {
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  }

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

  const uploadToCloudinary = (file) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "emergency-posts",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });

  const notifyRespondersByEmail = async ({ responders, post, requesterName }) => {
    if (!mailTransporter || !mailFrom) return;

    const recipients = responders.map((responder) => responder.email).filter(Boolean);
    if (!recipients.length) return;

    try {
      await mailTransporter.sendMail({
        from: mailFrom,
        to: recipients,
        subject: "Emergency Helper request nearby",
        text: `${requesterName} needs help nearby.\n\n${post.text || "Media attached"}\n\nOpen the Safe Travel app to respond.`,
      });
    } catch (error) {
      console.error("Emergency responder email notification failed:", error.message);
    }
  };

  const emergencyPostLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    keyGenerator: (req) => req.user?.email || ipKeyGenerator(req.ip),
    message: "Too many emergency posts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const getAuthenticatedProfile = async (req) => {
    if (!req.user?.email) return null;
    return Profile.findOne({ email: req.user.email });
  };

  const isValidCoordinatePair = (lat, lng) =>
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  router.post("/", emergencyPostLimiter, (req, res, next) => {
    upload.array("media", 4)(req, res, (error) => {
      if (error) return res.status(400).json({ error: error.message });
      return next();
    });
  }, async (req, res) => {
    const profile = await getAuthenticatedProfile(req);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    if (!text && !req.files?.length) {
      return res.status(400).json({ error: "Text or media is required" });
    }

    if (!isValidCoordinatePair(lat, lng)) {
      return res.status(400).json({ error: "Valid lat and lng are required" });
    }

    try {
      const nearbyProfiles = await Profile.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat],
            },
            key: "lastKnownLocation",
            distanceField: "distanceMeters",
            spherical: true,
            query: {
              _id: { $ne: profile._id },
              isOnline: true,
              lastKnownLocation: { $exists: true },
            },
          },
        },
        { $limit: 10 },
      ]);

      if (req.files?.length && !cloudinaryConfigured) {
        return res.status(500).json({ error: "Cloudinary is not configured" });
      }

      const uploadedMediaUrls = req.files?.length
        ? await Promise.all(req.files.map(uploadToCloudinary))
        : [];
      const responderIds = nearbyProfiles.map((responder) => responder._id);
      const emergencyPost = await EmergencyPost.create({
        userId: profile._id,
        text,
        mediaUrls: uploadedMediaUrls,
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
        respondersNotified: responderIds,
      });

      nearbyProfiles.forEach((responder) => {
        emitToUser(responder._id, "emergency:new", {
          postId: emergencyPost._id,
          requesterName: profile.name,
          textSnippet: text.slice(0, 200),
          mediaThumbnail: emergencyPost.mediaUrls[0] || null,
          distanceMeters: responder.distanceMeters,
        });
      });
      void notifyRespondersByEmail({
        responders: nearbyProfiles,
        post: emergencyPost,
        requesterName: profile.name,
      });

      return res.status(201).json({
        post: emergencyPost,
        responders: nearbyProfiles.map((responder) => ({
          _id: responder._id,
          name: responder.name,
          distanceMeters: responder.distanceMeters,
        })),
      });
    } catch (error) {
      console.error("Emergency post creation error:", error);
      return res.status(500).json({ error: "Failed to create emergency post" });
    }
  });

  router.get("/mine", async (req, res) => {
    const profile = await getAuthenticatedProfile(req);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    try {
      const posts = await EmergencyPost.find({ userId: profile._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("respondersAccepted", "name email contact");
      return res.json({ posts });
    } catch (error) {
      console.error("Emergency sent history error:", error);
      return res.status(500).json({ error: "Failed to load sent requests" });
    }
  });

  router.get("/received", async (req, res) => {
    const profile = await getAuthenticatedProfile(req);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    try {
      const posts = await EmergencyPost.find({
        respondersNotified: profile._id,
        status: "open",
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("userId", "name");
      return res.json({ posts });
    } catch (error) {
      console.error("Emergency received history error:", error);
      return res.status(500).json({ error: "Failed to load received requests" });
    }
  });

  router.get("/:id/messages", async (req, res) => {
    const profile = await getAuthenticatedProfile(req);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    try {
      const post = await EmergencyPost.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Emergency post not found" });

      const isRequester = post.userId.equals(profile._id);
      const isAcceptedResponder = post.respondersAccepted.some((id) => id.equals(profile._id));
      if (!isRequester && !isAcceptedResponder) {
        return res.status(403).json({ error: "You are not a participant" });
      }

      const messages = await Message.find({ postId: post._id })
        .sort({ createdAt: 1 })
        .populate("senderId", "name");
      return res.json({ messages });
    } catch (error) {
      console.error("Emergency message history error:", error);
      return res.status(500).json({ error: "Failed to load messages" });
    }
  });

  router.patch("/:id/accept", async (req, res) => {
    const profile = await getAuthenticatedProfile(req);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    try {
      const emergencyPost = await EmergencyPost.findOne({
        _id: req.params.id,
        status: "open",
      });

      if (!emergencyPost) {
        return res.status(404).json({ error: "Open emergency post not found" });
      }

      const wasNotified = emergencyPost.respondersNotified.some((id) =>
        id.equals(profile._id)
      );
      if (!wasNotified) {
        return res.status(403).json({ error: "You were not notified for this post" });
      }

      await EmergencyPost.updateOne(
        { _id: emergencyPost._id },
        { $addToSet: { respondersAccepted: profile._id } }
      );

      const updatedPost = await EmergencyPost.findById(emergencyPost._id);
      const roomId = `emergency:${emergencyPost._id}`;
      joinUserToRoom(emergencyPost.userId, roomId);
      joinUserToRoom(profile._id, roomId);
      return res.json({
        post: updatedPost,
        roomId,
      });
    } catch (error) {
      console.error("Emergency accept error:", error);
      return res.status(500).json({ error: "Failed to accept emergency post" });
    }
  });

  router.patch("/:id/resolve", async (req, res) => {
    const profile = await getAuthenticatedProfile(req);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    try {
      const emergencyPost = await EmergencyPost.findById(req.params.id);
      if (!emergencyPost) {
        return res.status(404).json({ error: "Emergency post not found" });
      }

      const isRequester = emergencyPost.userId.equals(profile._id);
      const isAcceptedResponder = emergencyPost.respondersAccepted.some((id) =>
        id.equals(profile._id)
      );

      if (!isRequester && !isAcceptedResponder) {
        return res.status(403).json({ error: "You cannot resolve this emergency" });
      }

      emergencyPost.status = "resolved";
      await emergencyPost.save();

      return res.json({ post: emergencyPost });
    } catch (error) {
      console.error("Emergency resolve error:", error);
      return res.status(500).json({ error: "Failed to resolve emergency post" });
    }
  });

  return router;
}
