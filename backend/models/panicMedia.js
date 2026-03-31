import mongoose from "mongoose";

const PanicMediaSchema = new mongoose.Schema(
  {
    panic_request_id: { type: String, index: true },
    email: { type: String, required: true },
    contact_number: { type: String, required: true },
    photo_urls: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("PanicMedia", PanicMediaSchema);
