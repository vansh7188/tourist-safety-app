import mongoose from "mongoose";

const guideReviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideBooking",
      required: true,
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideProfile",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    flagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

guideReviewSchema.index({ guideId: 1, createdAt: -1 });
guideReviewSchema.index({ bookingId: 1 }, { unique: true });
guideReviewSchema.index({ reviewerId: 1 });

export const GuideReview = mongoose.model("GuideReview", guideReviewSchema);
