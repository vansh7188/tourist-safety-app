import mongoose from "mongoose";

const guideMessageSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideBooking",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

guideMessageSchema.index({ bookingId: 1, createdAt: 1 });

export const GuideMessage = mongoose.model("GuideMessage", guideMessageSchema);
