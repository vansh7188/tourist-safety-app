import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export function createGuideRouter({
  GuideProfile,
  GuideBooking,
  GuideReview,
  GuideMessage,
  Profile,
  DigitalId,
  emitToUser = () => {},
}) {
  const router = express.Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 6 },
    fileFilter: (req, file, callback) => {
      if (/^image\//.test(file.mimetype)) return callback(null, true);
      return callback(new Error("Only image files are allowed"));
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

  const uploadToCloudinary = (buffer, folder = "guide-profiles") =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result) => (error ? reject(error) : resolve(result.secure_url))
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });

  // Middleware: require verified digital ID
  const requireDigitalId = async (req, res, next) => {
    try {
      const did = await DigitalId.findOne({ email: req.user.email });
      if (!did) {
        return res.status(403).json({ error: "Digital ID required. Please create your Digital ID first." });
      }
      req.digitalId = did;
      return next();
    } catch (error) {
      return res.status(500).json({ error: "Failed to verify Digital ID" });
    }
  };

  // ───────────────── Become a Guide ─────────────────
  router.post(
    "/register",
    requireDigitalId,
    upload.fields([
      { name: "coverPhoto", maxCount: 1 },
      { name: "galleryPhotos", maxCount: 5 },
    ]),
    async (req, res) => {
      try {
        const profile = await Profile.findOne({ email: req.user.email });
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const existing = await GuideProfile.findOne({ userId: profile._id });
        if (existing) return res.status(409).json({ error: "You are already registered as a guide", guide: existing });

        const {
          bio = "",
          languages = "[]",
          specialties = "[]",
          experienceYears = 0,
          city = "",
          longitude,
          latitude,
          hourlyRate = 0,
          halfDayRate = 0,
          fullDayRate = 0,
          currency = "INR",
        } = req.body;

        let coverPhotoUrl = "";
        if (req.files?.coverPhoto?.[0] && cloudinaryConfigured) {
          coverPhotoUrl = await uploadToCloudinary(req.files.coverPhoto[0].buffer, "guide-profiles/covers");
        }

        const galleryUrls = [];
        if (req.files?.galleryPhotos && cloudinaryConfigured) {
          for (const file of req.files.galleryPhotos) {
            galleryUrls.push(await uploadToCloudinary(file.buffer, "guide-profiles/gallery"));
          }
        }

        const parseSafe = (value) => {
          try {
            return typeof value === "string" ? JSON.parse(value) : value;
          } catch {
            return [];
          }
        };

        const lng = Number(longitude) || 0;
        const lat = Number(latitude) || 0;

        const guide = await GuideProfile.create({
          userId: profile._id,
          bio,
          languages: parseSafe(languages),
          specialties: parseSafe(specialties),
          experienceYears: Number(experienceYears) || 0,
          city,
          location: { type: "Point", coordinates: [lng, lat] },
          coverPhoto: coverPhotoUrl,
          galleryPhotos: galleryUrls,
          pricing: {
            hourly: Number(hourlyRate) || 0,
            halfDay: Number(halfDayRate) || 0,
            fullDay: Number(fullDayRate) || 0,
            currency,
          },
        });

        return res.status(201).json({ guide });
      } catch (error) {
        console.error("Guide registration error:", error);
        return res.status(500).json({ error: "Failed to register as guide" });
      }
    }
  );

  // ───────────────── Update Guide Profile ─────────────────
  router.patch(
    "/profile",
    requireDigitalId,
    upload.fields([
      { name: "coverPhoto", maxCount: 1 },
      { name: "galleryPhotos", maxCount: 5 },
    ]),
    async (req, res) => {
      try {
        const profile = await Profile.findOne({ email: req.user.email });
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const guide = await GuideProfile.findOne({ userId: profile._id });
        if (!guide) return res.status(404).json({ error: "Guide profile not found" });

        const updates = {};
        const {
          bio, languages, specialties, experienceYears, city,
          longitude, latitude, hourlyRate, halfDayRate, fullDayRate,
          currency, availability,
        } = req.body;

        if (bio !== undefined) updates.bio = bio;
        if (city !== undefined) updates.city = city;
        if (experienceYears !== undefined) updates.experienceYears = Number(experienceYears) || 0;

        const parseSafe = (value) => {
          try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return undefined; }
        };
        if (languages !== undefined) {
          const parsed = parseSafe(languages);
          if (parsed) updates.languages = parsed;
        }
        if (specialties !== undefined) {
          const parsed = parseSafe(specialties);
          if (parsed) updates.specialties = parsed;
        }
        if (availability !== undefined) {
          const parsed = parseSafe(availability);
          if (parsed) updates.availability = parsed;
        }

        if (longitude !== undefined && latitude !== undefined) {
          updates.location = { type: "Point", coordinates: [Number(longitude), Number(latitude)] };
        }

        if (hourlyRate !== undefined || halfDayRate !== undefined || fullDayRate !== undefined || currency !== undefined) {
          updates.pricing = {
            hourly: hourlyRate !== undefined ? Number(hourlyRate) : guide.pricing.hourly,
            halfDay: halfDayRate !== undefined ? Number(halfDayRate) : guide.pricing.halfDay,
            fullDay: fullDayRate !== undefined ? Number(fullDayRate) : guide.pricing.fullDay,
            currency: currency || guide.pricing.currency,
          };
        }

        if (req.files?.coverPhoto?.[0] && cloudinaryConfigured) {
          updates.coverPhoto = await uploadToCloudinary(req.files.coverPhoto[0].buffer, "guide-profiles/covers");
        }
        if (req.files?.galleryPhotos && cloudinaryConfigured) {
          const urls = [];
          for (const file of req.files.galleryPhotos) {
            urls.push(await uploadToCloudinary(file.buffer, "guide-profiles/gallery"));
          }
          updates.galleryPhotos = [...guide.galleryPhotos, ...urls].slice(0, 10);
        }

        const updated = await GuideProfile.findByIdAndUpdate(guide._id, updates, { new: true });
        return res.json({ guide: updated });
      } catch (error) {
        console.error("Guide update error:", error);
        return res.status(500).json({ error: "Failed to update guide profile" });
      }
    }
  );

  // ───────────────── Get My Guide Profile ─────────────────
  router.get("/me", async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const guide = await GuideProfile.findOne({ userId: profile._id }).populate("userId", "name email contact");
      if (!guide) return res.status(404).json({ error: "Not registered as a guide" });

      return res.json({ guide });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch guide profile" });
    }
  });

  // ───────────────── Search / Discover Guides ─────────────────
  router.get("/search", async (req, res) => {
    try {
      const {
        city,
        latitude,
        longitude,
        radiusKm = 50,
        language,
        specialty,
        minRating = 0,
        page = 1,
        limit = 20,
      } = req.query;

      const filter = { isActive: true };

      if (city) filter.city = { $regex: new RegExp(city, "i") };
      if (language) filter.languages = { $in: [language] };
      if (specialty) filter.specialties = { $in: [specialty] };
      if (Number(minRating) > 0) filter["rating.average"] = { $gte: Number(minRating) };

      const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

      let guides;

      if (latitude && longitude) {
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          guides = await GuideProfile.aggregate([
            {
              $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                distanceField: "distanceMeters",
                maxDistance: Number(radiusKm) * 1000,
                spherical: true,
                query: filter,
              },
            },
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: "profiles",
                localField: "userId",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $project: { name: 1, email: 1 } }],
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          ]);
        } else {
          guides = await GuideProfile.find(filter)
            .sort({ "rating.average": -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate("userId", "name email");
        }
      } else {
        guides = await GuideProfile.find(filter)
          .sort({ "rating.average": -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate("userId", "name email");
      }

      const total = await GuideProfile.countDocuments(filter);

      return res.json({ guides, total, page: Number(page), limit: Number(limit) });
    } catch (error) {
      console.error("Guide search error:", error);
      return res.status(500).json({ error: "Failed to search guides" });
    }
  });

  // ───────────────── Get Public Guide Profile ─────────────────
  router.get("/:guideId", async (req, res) => {
    try {
      const guide = await GuideProfile.findById(req.params.guideId).populate("userId", "name email");
      if (!guide) return res.status(404).json({ error: "Guide not found" });

      const reviews = await GuideReview.find({ guideId: guide._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("reviewerId", "name");

      return res.json({ guide, reviews });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch guide" });
    }
  });

  // ───────────────── Book a Guide ─────────────────
  router.post("/:guideId/book", requireDigitalId, async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const guide = await GuideProfile.findById(req.params.guideId);
      if (!guide) return res.status(404).json({ error: "Guide not found" });
      if (!guide.isActive) return res.status(400).json({ error: "This guide is currently unavailable" });
      if (guide.userId.equals(profile._id)) {
        return res.status(400).json({ error: "You cannot book yourself" });
      }

      const { date, duration, hours = 1, meetingPoint = "", notes = "" } = req.body;
      if (!date || !duration) return res.status(400).json({ error: "date and duration are required" });

      const bookingDate = new Date(date);
      if (bookingDate < new Date()) return res.status(400).json({ error: "Cannot book a date in the past" });

      // Check day availability
      const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][bookingDate.getDay()];
      if (!guide.availability[dayName]) {
        return res.status(400).json({ error: `Guide is not available on ${dayName}s` });
      }

      // Check blocked dates
      const dateStr = bookingDate.toISOString().split("T")[0];
      const isBlocked = guide.blockedDates.some(
        (blockedDate) => new Date(blockedDate).toISOString().split("T")[0] === dateStr
      );
      if (isBlocked) return res.status(400).json({ error: "Guide is not available on this date" });

      // Check if there's already a confirmed booking on the same date
      const existingBooking = await GuideBooking.findOne({
        guideId: guide._id,
        date: {
          $gte: new Date(dateStr),
          $lt: new Date(new Date(dateStr).getTime() + 86400000),
        },
        status: { $in: ["pending", "confirmed"] },
      });
      if (existingBooking) return res.status(409).json({ error: "Guide already has a booking on this date" });

      // Calculate price
      let totalPrice = 0;
      const h = Math.max(1, Math.min(12, Number(hours)));
      if (duration === "hourly") totalPrice = guide.pricing.hourly * h;
      else if (duration === "halfDay") totalPrice = guide.pricing.halfDay;
      else if (duration === "fullDay") totalPrice = guide.pricing.fullDay;
      else return res.status(400).json({ error: "Invalid duration type" });

      const booking = await GuideBooking.create({
        guideId: guide._id,
        guideUserId: guide.userId,
        touristId: profile._id,
        date: bookingDate,
        duration,
        hours: h,
        totalPrice,
        currency: guide.pricing.currency,
        meetingPoint: typeof meetingPoint === "string" ? { address: meetingPoint } : meetingPoint,
        notes,
      });

      // Notify the guide via socket
      emitToUser(guide.userId, "guide:newBooking", {
        bookingId: booking._id,
        touristName: profile.name,
        date: bookingDate,
        duration,
      });

      return res.status(201).json({ booking });
    } catch (error) {
      console.error("Booking error:", error);
      return res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // ───────────────── My Bookings (as tourist) ─────────────────
  router.get("/bookings/mine", async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const bookings = await GuideBooking.find({ touristId: profile._id })
        .sort({ createdAt: -1 })
        .populate("guideUserId", "name email")
        .populate("guideId", "bio city coverPhoto rating");

      return res.json({ bookings });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // ───────────────── Guide's Bookings (as guide) ─────────────────
  router.get("/bookings/received", async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const bookings = await GuideBooking.find({ guideUserId: profile._id })
        .sort({ createdAt: -1 })
        .populate("touristId", "name email contact");

      return res.json({ bookings });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // ───────────────── Confirm / Cancel / Complete Booking ─────────────────
  router.patch("/bookings/:bookingId/status", async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const booking = await GuideBooking.findById(req.params.bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const { status, cancelReason = "" } = req.body;
      const isGuide = booking.guideUserId.equals(profile._id);
      const isTourist = booking.touristId.equals(profile._id);
      if (!isGuide && !isTourist) return res.status(403).json({ error: "Not authorized" });

      if (status === "confirmed") {
        if (!isGuide) return res.status(403).json({ error: "Only the guide can confirm bookings" });
        if (booking.status !== "pending") return res.status(400).json({ error: "Can only confirm pending bookings" });
        booking.status = "confirmed";
        emitToUser(booking.touristId, "guide:bookingConfirmed", { bookingId: booking._id });
      } else if (status === "cancelled") {
        if (!["pending", "confirmed"].includes(booking.status)) {
          return res.status(400).json({ error: "Cannot cancel this booking" });
        }
        booking.status = "cancelled";
        booking.cancelledBy = profile._id;
        booking.cancelReason = cancelReason;
        const notifyTarget = isGuide ? booking.touristId : booking.guideUserId;
        emitToUser(notifyTarget, "guide:bookingCancelled", { bookingId: booking._id });
      } else if (status === "completed") {
        if (!isGuide) return res.status(403).json({ error: "Only the guide can mark bookings complete" });
        if (booking.status !== "confirmed") return res.status(400).json({ error: "Can only complete confirmed bookings" });
        booking.status = "completed";
        booking.completedAt = new Date();
        await GuideProfile.findByIdAndUpdate(booking.guideId, { $inc: { totalBookings: 1 } });
        emitToUser(booking.touristId, "guide:bookingCompleted", { bookingId: booking._id });
      } else {
        return res.status(400).json({ error: "Invalid status" });
      }

      await booking.save();
      return res.json({ booking });
    } catch (error) {
      console.error("Booking status update error:", error);
      return res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // ───────────────── Submit Review ─────────────────
  router.post("/bookings/:bookingId/review", async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const booking = await GuideBooking.findById(req.params.bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      if (!booking.touristId.equals(profile._id)) return res.status(403).json({ error: "Only the tourist can leave a review" });
      if (booking.status !== "completed") return res.status(400).json({ error: "Can only review completed bookings" });

      const existingReview = await GuideReview.findOne({ bookingId: booking._id });
      if (existingReview) return res.status(409).json({ error: "You already reviewed this booking" });

      const { rating, text = "" } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be between 1 and 5" });

      const review = await GuideReview.create({
        bookingId: booking._id,
        guideId: booking.guideId,
        reviewerId: profile._id,
        rating: Number(rating),
        text,
      });

      // Recalculate the guide's average rating
      const stats = await GuideReview.aggregate([
        { $match: { guideId: booking.guideId } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      if (stats.length) {
        await GuideProfile.findByIdAndUpdate(booking.guideId, {
          "rating.average": Math.round(stats[0].avg * 10) / 10,
          "rating.count": stats[0].count,
        });
      }

      return res.status(201).json({ review });
    } catch (error) {
      console.error("Review error:", error);
      return res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // ───────────────── Guide Reviews ─────────────────
  router.get("/:guideId/reviews", async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

      const reviews = await GuideReview.find({ guideId: req.params.guideId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("reviewerId", "name");

      const total = await GuideReview.countDocuments({ guideId: req.params.guideId });
      return res.json({ reviews, total, page: Number(page) });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // ───────────────── Booking Messages ─────────────────
  router.get("/bookings/:bookingId/messages", async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const booking = await GuideBooking.findById(req.params.bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      if (!booking.guideUserId.equals(profile._id) && !booking.touristId.equals(profile._id)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const messages = await GuideMessage.find({ bookingId: booking._id })
        .sort({ createdAt: 1 })
        .populate("senderId", "name email");

      return res.json({ messages });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // ───────────────── Toggle Active Status ─────────────────
  router.patch("/toggle-active", async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const guide = await GuideProfile.findOne({ userId: profile._id });
      if (!guide) return res.status(404).json({ error: "Not registered as a guide" });

      guide.isActive = !guide.isActive;
      await guide.save();

      return res.json({ isActive: guide.isActive });
    } catch (error) {
      return res.status(500).json({ error: "Failed to toggle status" });
    }
  });

  // ───────────────── Block / Unblock Dates ─────────────────
  router.patch("/blocked-dates", async (req, res) => {
    try {
      const profile = await Profile.findOne({ email: req.user.email });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const guide = await GuideProfile.findOne({ userId: profile._id });
      if (!guide) return res.status(404).json({ error: "Not registered as a guide" });

      const { add = [], remove = [] } = req.body;
      const addDates = add.map((d) => new Date(d));
      const removeSet = new Set(remove.map((d) => new Date(d).toISOString().split("T")[0]));

      guide.blockedDates = [
        ...guide.blockedDates.filter(
          (d) => !removeSet.has(new Date(d).toISOString().split("T")[0])
        ),
        ...addDates,
      ];
      await guide.save();

      return res.json({ blockedDates: guide.blockedDates });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update blocked dates" });
    }
  });

  return router;
}
