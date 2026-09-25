import mongoose from "mongoose";

const guideProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },
    languages: {
      type: [String],
      default: [],
    },
    specialties: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        validate: {
          validator: (coordinates) =>
            coordinates.length === 2 &&
            coordinates.every((coordinate) => Number.isFinite(coordinate)),
          message: "Location must contain [longitude, latitude]",
        },
      },
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    coverPhoto: {
      type: String,
      default: "",
    },
    galleryPhotos: {
      type: [String],
      default: [],
    },
    pricing: {
      hourly: { type: Number, min: 0, default: 0 },
      halfDay: { type: Number, min: 0, default: 0 },
      fullDay: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: "INR" },
    },
    availability: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: true },
      sunday: { type: Boolean, default: false },
    },
    blockedDates: {
      type: [Date],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

guideProfileSchema.index({ location: "2dsphere" });
guideProfileSchema.index({ userId: 1 });
guideProfileSchema.index({ city: 1, isActive: 1 });
guideProfileSchema.index({ "rating.average": -1 });
guideProfileSchema.index({ verified: 1, isActive: 1 });

export const GuideProfile = mongoose.model("GuideProfile", guideProfileSchema);
