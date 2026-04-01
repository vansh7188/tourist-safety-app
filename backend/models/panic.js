import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  coordinates: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true // [lon, lat]
    }
  },
  state: String,
  city: String,
  district: String,
  place_id: String,
  type: String,
  detailed_address: String,
  postcode: String
}, { _id: false }); // prevent extra _id for each location

const PanicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "DigitalId" },
  panic_request_id: { type: String, index: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  contact_number: { type: String, required: true },
  kyc: {
    aadhaar: {
      number: { type: String }
    },
    passport: {
      number: { type: String },
      country: { type: String }
    }
  },
  emergency_contacts: [
    {
      name: { type: String },
      phone: { type: String },
      relation: { type: String }
    }
  ],
  panic_query: { type: String },
  delivery_source: {
    type: String,
    enum: ["direct", "offline_queue"],
    default: "direct"
  },
  client_triggered_at: {
    type: Date,
    default: null
  },
  queued_at: {
    type: Date,
    default: null
  },
  synced_at: {
    type: Date,
    default: null
  },
  locations: [LocationSchema], // ✅ use subschema
  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved"],
    default: "pending"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "high"
  },
  notes: {
    type: String,
    default: ""
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model("Panic", PanicSchema);
