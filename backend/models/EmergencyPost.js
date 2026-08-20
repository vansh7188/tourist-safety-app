import mongoose from "mongoose";

const emergencyPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coordinates) =>
            coordinates.length === 2 &&
            coordinates.every((coordinate) => Number.isFinite(coordinate)),
          message: "Location must contain [longitude, latitude]",
        },
      },
    },
    status: {
      type: String,
      enum: ["open", "resolved", "cancelled"],
      default: "open",
    },
    respondersNotified: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],
    respondersAccepted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],
  },
  { timestamps: true }
);

emergencyPostSchema.index({ location: "2dsphere" });
emergencyPostSchema.index({ userId: 1, createdAt: -1 });

export const EmergencyPost = mongoose.model(
  "EmergencyPost",
  emergencyPostSchema
);
