import express from "express";
import jwt from "jsonwebtoken";
import Admin from "./models/Admin.js";
import Panic from "./models/panic.js";
import PanicMedia from "./models/panicMedia.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export function createAdminRouter() {
  const router = express.Router();

  // Middleware: Verify Admin JWT
  const verifyAdminToken = (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };

  // 📝 Admin Login
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const admin = await Admin.findOne({ email }).select("+password");

      if (!admin) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!admin.isActive) {
        return res.status(401).json({ error: "Admin account is disabled" });
      }

      const isPasswordValid = await admin.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // 📝 Admin Register (Super Admin only)
  router.post("/register", verifyAdminToken, async (req, res) => {
    try {
      // Only super_admin can create new admins
      if (req.admin.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "Only super admin can create new admins" });
      }

      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res
          .status(400)
          .json({
            error: "Email, password, and name are required",
          });
      }

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ error: "Admin already exists" });
      }

      const newAdmin = new Admin({
        email,
        password,
        name,
        role: role || "admin",
      });

      await newAdmin.save();

      res.status(201).json({
        message: "Admin created successfully",
        admin: {
          id: newAdmin._id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
        },
      });
    } catch (error) {
      console.error("Admin registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // 📊 Get All Panic Requests (with search, filter, and sort)
  router.get("/panics", verifyAdminToken, async (req, res) => {
    try {
      if (!req.admin.permissions.canViewPanics) {
        return res.status(403).json({ error: "No permission to view panics" });
      }

      const {
        search,
        status,
        priority,
        deliverySource,
        sortBy = "createdAt",
        order = "desc",
        page = 1,
        limit = 20,
      } = req.query;

      const filter = {};

      // Search filter (search in name, email, contact_number, panic_query)
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { contact_number: { $regex: search, $options: "i" } },
          { panic_query: { $regex: search, $options: "i" } },
        ];
      }

      // Status filter
      if (status) {
        filter.status = status;
      }

      // Priority filter
      if (priority) {
        filter.priority = priority;
      }

      // Delivery source filter
      if (deliverySource) {
        filter.delivery_source = deliverySource;
      }

      const skip = (page - 1) * limit;
      const sortObj = {};
      sortObj[sortBy] = order === "asc" ? 1 : -1;

      const panics = await Panic.find(filter)
        .populate("assignedTo", "name email")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Panic.countDocuments(filter);

      res.json({
        data: panics,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching panics:", error);
      res.status(500).json({ error: "Failed to fetch panic requests" });
    }
  });

  // 🔍 Get Single Panic Request
  router.get("/panics/:id", verifyAdminToken, async (req, res) => {
    try {
      if (!req.admin.permissions.canViewPanics) {
        return res.status(403).json({ error: "No permission to view panics" });
      }

      const panic = await Panic.findById(req.params.id).populate(
        "assignedTo",
        "name email"
      );

      if (!panic) {
        return res.status(404).json({ error: "Panic request not found" });
      }

      res.json({ data: panic });
    } catch (error) {
      console.error("Error fetching panic:", error);
      res.status(500).json({ error: "Failed to fetch panic request" });
    }
  });

  // ✅ Update Panic Status
  router.put("/panics/:id/status", verifyAdminToken, async (req, res) => {
    try {
      if (!req.admin.permissions.canUpdateStatus) {
        return res.status(403).json({ error: "No permission to update status" });
      }

      const { status, priority, notes, assignedTo } = req.body;

      const update = {};
      if (status) update.status = status;
      if (priority) update.priority = priority;
      if (notes) update.notes = notes;
      if (assignedTo) update.assignedTo = assignedTo;

      if (status === "resolved") {
        update.resolvedAt = new Date();
      }

      const panic = await Panic.findByIdAndUpdate(req.params.id, update, {
        new: true,
      }).populate("assignedTo", "name email");

      if (!panic) {
        return res.status(404).json({ error: "Panic request not found" });
      }

      res.json({ message: "Panic updated successfully", data: panic });
    } catch (error) {
      console.error("Error updating panic:", error);
      res.status(500).json({ error: "Failed to update panic" });
    }
  });

  // 🗑️ Delete Panic Request (recommended after resolving)
  router.delete("/panics/:id", verifyAdminToken, async (req, res) => {
    try {
      if (!req.admin.permissions.canUpdateStatus) {
        return res.status(403).json({ error: "No permission to delete panic" });
      }

      const panic = await Panic.findById(req.params.id);

      if (!panic) {
        return res.status(404).json({ error: "Panic request not found" });
      }

      if (panic.status !== "resolved") {
        return res.status(400).json({
          error: "Only resolved panic requests can be deleted",
        });
      }

      await Panic.findByIdAndDelete(req.params.id);

      let deletedMediaCount = 0;
      if (panic.panic_request_id) {
        const mediaDeleteResult = await PanicMedia.deleteMany({
          panic_request_id: panic.panic_request_id,
        });
        deletedMediaCount = mediaDeleteResult.deletedCount || 0;
      }

      res.json({
        message: "Panic request deleted successfully",
        deletedMediaCount,
      });
    } catch (error) {
      console.error("Error deleting panic:", error);
      res.status(500).json({ error: "Failed to delete panic" });
    }
  });

  // 📊 Get Dashboard Stats
  router.get("/stats/dashboard", verifyAdminToken, async (req, res) => {
    try {
      const totalPanics = await Panic.countDocuments();
      const pendingPanics = await Panic.countDocuments({ status: "pending" });
      const inProgressPanics = await Panic.countDocuments({
        status: "in_progress",
      });
      const resolvedPanics = await Panic.countDocuments({ status: "resolved" });

      const criticalPanics = await Panic.countDocuments({
        priority: "critical",
        status: { $ne: "resolved" },
      });
      const highPanics = await Panic.countDocuments({
        priority: "high",
        status: { $ne: "resolved" },
      });

      const recentPanics = await Panic.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("assignedTo", "name");

      res.json({
        summary: {
          totalPanics,
          pendingPanics,
          inProgressPanics,
          resolvedPanics,
          criticalPanics,
          highPanics,
        },
        recentPanics,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // 📈 Get Analytics
  router.get("/stats/analytics", verifyAdminToken, async (req, res) => {
    try {
      if (!req.admin.permissions.canViewAnalytics) {
        return res.status(403).json({ error: "No permission to view analytics" });
      }

      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const panicsOverTime = await Panic.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const priorityDistribution = await Panic.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]);

      const statusDistribution = await Panic.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const avgResolutionTime = await Panic.aggregate([
        {
          $match: {
            status: "resolved",
            resolvedAt: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: {
              $avg: {
                $subtract: ["$resolvedAt", "$createdAt"],
              },
            },
          },
        },
      ]);

      res.json({
        panicsOverTime,
        priorityDistribution,
        statusDistribution,
        averageResolutionTimeMs:
          avgResolutionTime.length > 0 ? avgResolutionTime[0].avgTime : 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get all admins (super_admin only)
  router.get("/admins", verifyAdminToken, async (req, res) => {
    try {
      if (req.admin.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admin can view admins" });
      }

      const admins = await Admin.find({}, "-password");
      res.json({ data: admins });
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  return router;
}
