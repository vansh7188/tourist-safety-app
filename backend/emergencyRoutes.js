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
  DigitalId,
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

  const notifyRespondersByEmail = async ({ responders, post, requesterName, requesterDigitalId }) => {
    if (!mailTransporter || !mailFrom) return;

    const recipients = responders.map((responder) => responder.email).filter(Boolean);
    if (!recipients.length) return;

    const digitalIdText = requesterDigitalId ? `\nSender's Digital ID: ${requesterDigitalId}\n` : "";

    try {
      await mailTransporter.sendMail({
        from: mailFrom,
        to: recipients,
        subject: "Emergency Helper request nearby",
        text: `${requesterName} needs help nearby.${digitalIdText}\n${post.text || "Media attached"}\n\nOpen the Safe Travel app to respond.`,
      });
    } catch (error) {
      console.error("Emergency responder email notification failed:", error.message);
    }
  };

  const emergencyPostLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
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
      // Get sender's Digital ID for email notification
      const senderDigitalId = await DigitalId.findOne({ email: profile.email });
      const senderDigitalIdNumber = senderDigitalId?.digitalIdNumber || null;

      // Search DigitalId collection for 10 nearest online people with Digital IDs
      const nearbyDigitalIds = await DigitalId.aggregate([
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
              email: { $ne: profile.email },
              isOnline: true,
              lastKnownLocation: { $exists: true },
            },
          },
        },
        { $limit: 10 },
      ]);

      // Get Profile references for these Digital IDs to maintain compatibility
      const responderEmails = nearbyDigitalIds.map((did) => did.email);
      const responderProfiles = await Profile.find({ email: { $in: responderEmails } });
      const profileMap = new Map(responderProfiles.map((p) => [p.email, p]));

      if (req.files?.length && !cloudinaryConfigured) {
        return res.status(500).json({ error: "Cloudinary is not configured" });
      }

      const uploadedMediaUrls = req.files?.length
        ? await Promise.all(req.files.map(uploadToCloudinary))
        : [];

      const responderIds = responderProfiles.map((p) => p._id);
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

      // For each responder, check if this requester has sent them previous requests
      for (const digitalId of nearbyDigitalIds) {
        const responderProfile = profileMap.get(digitalId.email);
        if (!responderProfile) continue;

        const previousRequestCount = await EmergencyPost.countDocuments({
          userId: profile._id,
          respondersNotified: responderProfile._id,
          _id: { $ne: emergencyPost._id },
        });

        const hasPreviousAccepted = await EmergencyPost.exists({
          userId: profile._id,
          respondersAccepted: responderProfile._id,
        });

        emitToUser(responderProfile._id, "emergency:new", {
          postId: emergencyPost._id,
          userId: profile._id,
          requesterName: profile.name,
          textSnippet: text.slice(0, 200),
          mediaThumbnail: emergencyPost.mediaUrls[0] || null,
          distanceMeters: digitalId.distanceMeters,
          location: emergencyPost.location,
          isRepeatRequester: previousRequestCount > 0 || Boolean(hasPreviousAccepted),
          requesterRequestCount: previousRequestCount + 1,
          hasPreviousAccepted: Boolean(hasPreviousAccepted),
        });
      }

      void notifyRespondersByEmail({
        responders: nearbyDigitalIds,
        post: emergencyPost,
        requesterName: profile.name,
        requesterDigitalId: senderDigitalIdNumber,
      });

      return res.status(201).json({
        post: emergencyPost,
        responders: nearbyDigitalIds.map((digitalId) => ({
          _id: profileMap.get(digitalId.email)?._id,
          name: digitalId.name,
          email: digitalId.email,
          digitalIdNumber: digitalId.digitalIdNumber,
          distanceMeters: digitalId.distanceMeters,
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
        .populate("userId", "name email");

      // For each unique requester, calculate request count and previous acceptance
      const requesterIds = [...new Set(posts.map(p => p.userId?._id?.toString()).filter(Boolean))];
      const requesterStats = {};

      for (const requesterId of requesterIds) {
        const totalRequests = await EmergencyPost.countDocuments({
          userId: requesterId,
          respondersNotified: profile._id,
        });

        const hasPreviousAccepted = await EmergencyPost.exists({
          userId: requesterId,
          respondersAccepted: profile._id,
        });

        requesterStats[requesterId] = {
          totalRequests,
          hasPreviousAccepted: Boolean(hasPreviousAccepted),
        };
      }

      const postsWithAcceptance = posts.map((post) => {
        const postObject = post.toObject();
        const requesterId = post.userId?._id?.toString();
        const stats = requesterStats[requesterId] || { totalRequests: 1, hasPreviousAccepted: false };

        return {
          ...postObject,
          acceptedByMe: post.respondersAccepted?.some((id) => id.equals(profile._id)) || false,
          isRepeatRequester: stats.totalRequests > 1 || stats.hasPreviousAccepted,
          requesterRequestCount: stats.totalRequests,
          hasPreviousAccepted: stats.hasPreviousAccepted,
        };
      });

      return res.json({ posts: postsWithAcceptance });
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

      // Keep continuous conversation history between the same user pair across requests
      let relatedPostIds = [post._id];

      if (isAcceptedResponder) {
        // If current user is a helper, find all posts from this same requester that this helper accepted or is viewing
        const relatedPosts = await EmergencyPost.find({
          userId: post.userId,
          $or: [
            { respondersAccepted: profile._id },
            { _id: post._id },
          ],
        }).select("_id");
        relatedPostIds = relatedPosts.map((p) => p._id);
      } else if (isRequester && post.respondersAccepted?.length > 0) {
        // If current user is the requester, find all posts by this requester involving these same helpers
        const relatedPosts = await EmergencyPost.find({
          userId: profile._id,
          $or: [
            { respondersAccepted: { $in: post.respondersAccepted } },
            { _id: post._id },
          ],
        }).select("_id");
        relatedPostIds = relatedPosts.map((p) => p._id);
      }

      const messages = await Message.find({ postId: { $in: relatedPostIds } })
        .sort({ createdAt: 1 })
        .populate("senderId", "name email");
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
