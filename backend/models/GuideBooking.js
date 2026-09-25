import mongoose from "mongoose";

const guideBookingSchema = new mongoose.Schema(
  {
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideProfile",
      required: true,
    },
    guideUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    touristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: String,
      enum: ["hourly", "halfDay", "fullDay"],
      required: true,
    },
    hours: {
      type: Number,
      min: 1,
      max: 12,
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "disputed"],
      default: "pending",
    },
    meetingPoint: {
      address: { type: String, default: "" },
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
        },
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

guideBookingSchema.index({ guideId: 1, date: 1 });
guideBookingSchema.index({ touristId: 1, createdAt: -1 });
guideBookingSchema.index({ guideUserId: 1, status: 1 });
guideBookingSchema.index({ status: 1 });

export const GuideBooking = mongoose.model("GuideBooking", guideBookingSchema);
