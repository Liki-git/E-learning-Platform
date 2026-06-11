const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Course = require("../models/Course");
const AuditLog = require("../models/AuditLog");

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with filtering and search
 * GET /api/admin/users?role=student&search=john
 */
const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10, sortBy = "createdAt" } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new user (Admin only)
 * POST /api/admin/users
 * Body: { fullName, email, username, password, role }
 */
const createUser = async (req, res) => {
  try {
    const { fullName, email, username, password, role = "student" } = req.body;

    // Validation
    if (!fullName || !email || !username) {
      return res.status(400).json({
        success: false,
        message: "fullName, email, and username are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || "password123", 10);

    // Create user
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      role: role || "student",
    });

    // Log audit
    await logAudit(req.user._id, "CREATE_USER", user._id, `Created user: ${user.fullName}`);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get single user by ID
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update user (Edit user details)
 * PATCH /api/admin/users/:id
 * Body: { fullName, email, username, role, isSuspended, etc. }
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const allowedFields = ["fullName", "email", "username", "role", "isSuspended", "profilePic", "bio"];
    
    // Only allow specific fields to be updated
    const filteredUpdates = {};
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // If password is being updated
    if (req.body.password) {
      filteredUpdates.password = await bcrypt.hash(req.body.password, 10);
    }

    // Check for duplicate email/username if they're being updated
    if (updates.email || updates.username) {
      const existingUser = await User.findOne({
        $or: [
          { email: updates.email, _id: { $ne: id } },
          { username: updates.username, _id: { $ne: id } },
        ],
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email or username already exists",
        });
      }
    }

    const user = await User.findByIdAndUpdate(id, filteredUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Log audit
    await logAudit(req.user._id, "UPDATE_USER", user._id, `Updated user: ${user.fullName}`);

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount === 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin user",
        });
      }
    }

    await User.findByIdAndDelete(id);

    // Log audit
    await logAudit(req.user._id, "DELETE_USER", id, `Deleted user: ${user.fullName}`);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Suspend/Unsuspend user
 * PATCH /api/admin/users/:id/suspend
 * Body: { suspend: true/false }
 */
const toggleUserSuspension = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isSuspended: suspend },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const action = suspend ? "SUSPEND_USER" : "UNSUSPEND_USER";
    await logAudit(req.user._id, action, user._id, `${suspend ? "Suspended" : "Unsuspended"} user: ${user.fullName}`);

    res.json({
      success: true,
      message: `User ${suspend ? "suspended" : "unsuspended"} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user statistics
 * GET /api/admin/users/stats/overview
 */
const getUserStats = async (_req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: "student" });
    const instructors = await User.countDocuments({ role: "instructor" });
    const admins = await User.countDocuments({ role: "admin" });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });

    res.json({
      success: true,
      stats: {
        totalUsers,
        students,
        instructors,
        admins,
        suspendedUsers,
        activeUsers: totalUsers - suspendedUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== COURSE MANAGEMENT ====================

const getPendingCourses = async (_req, res) => {
  try {
    const courses = await Course.find({ status: "pending" }).populate("instructor", "fullName email");
    res.json({
      success: true,
      courses: courses.map((c) => ({
        id: c._id,
        title: c.title,
        category: c.category,
        level: c.level,
        price: c.price,
        instructorName: c.instructorName,
        instructorEmail: c.instructor?.email,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getManagedCoursesHistory = async (_req, res) => {
  try {
    const courses = await Course.find({
      status: { $in: ["published", "rejected"] },
    }).populate("instructor", "fullName email");
    res.json({
      success: true,
      courses: courses.map((c) => ({
        id: c._id,
        title: c.title,
        category: c.category,
        level: c.level,
        price: c.price,
        status: c.status,
        rejectionReason: c.rejectionReason,
        instructorName: c.instructorName,
        instructorEmail: c.instructor?.email,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== AUDIT LOGGING ====================

/**
 * Helper function to log audit trail
 */
const logAudit = async (adminId, action, targetId, description) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      targetId,
      description,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Audit logging error:", error);
  }
};

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
const getAuditLogs = async (_req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("adminId", "fullName email")
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  // User Management
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserSuspension,
  getUserStats,

  // Course Management
  getPendingCourses,
  getManagedCoursesHistory,

  // Audit
  getAuditLogs,
};
