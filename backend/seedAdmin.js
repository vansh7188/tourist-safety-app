import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI2 || "mongodb://localhost:27017/safe_travel";

async function seedAdmin() {
  try {
    console.log("🌱 Seeding admin user...");
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@safe-travel.com" });
    
    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    // Create default admin
    const admin = new Admin({
      email: "admin@safe-travel.com",
      password: "Admin@123", // This will be hashed by the model pre-save hook
      name: "Super Admin",
      role: "super_admin",
      permissions: {
        canViewPanics: true,
        canUpdateStatus: true,
        canManageAdmins: true,
        canViewAnalytics: true,
      },
      isActive: true,
    });

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log("\n📝 Default Admin Credentials:");
    console.log("   Email: admin@safe-travel.com");
    console.log("   Password: Admin@123");
    console.log("\n⚠️ Please change this password after first login!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
