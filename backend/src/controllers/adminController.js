const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Course = require("../models/Course");
const { notifyAdmins, notifyUser } = require("../utils/notify");
const { sendWelcomeEmail } = require("../utils/email");

const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullName, email, username, password, role } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !username || !role) {
      return res.status(400).json({ message: "fullName, email, username, and role are required" });
    }

    // Check if user already exists
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? "email" : "username";
      return res.status(409).json({ message: `User with this ${field} already exists` });
    }

    // Hash password (use provided password or generate a default)
    const hashedPassword = await bcrypt.hash(password || "TempPassword@123", 10);
    
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      role,
    });

    // Send welcome email to the newly created user
    try {
      await sendWelcomeEmail(
        user.email,
        user.fullName,
        user.username,
        role,
        password || "TempPassword@123"
      );
    } catch (emailError) {
      console.error("Welcome email send failed:", emailError);
      // Don't fail the user creation if email fails
    }

    // Notify admins about new user creation
    await notifyAdmins(
      "New User Added",
      `${req.user.fullName} added a new ${role}: ${fullName} (${email})`,
      "/admin/users"
    );

    res.status(201).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      message: `${role} account created and welcome email sent`,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Don't allow password update through this endpoint
    
    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Notify user of profile update
    if (Object.keys(updates).length > 0) {
      await notifyUser(user._id, user.email, {
        type: "system",
        title: "Profile Updated",
        message: "Your profile has been updated by an administrator",
      });
    }

    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Notify the user before deletion
    await notifyUser(user._id, user.email, {
      type: "system",
      title: "Account Deleted",
      message: "Your account has been deleted by an administrator. If you believe this is a mistake, please contact support.",
    });

    await user.deleteOne();

    // Notify admins
    await notifyAdmins(
      "User Deleted",
      `${req.user.fullName} deleted user: ${user.fullName} (${user.email})`,
      "/admin/users"
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Notify user of suspension
    await notifyUser(user._id, user.email, {
      type: "system",
      title: "Account Suspended",
      message: "Your account has been suspended. Please contact support for more information.",
    });

    res.json({ user, message: "User suspended" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Notify user of restoration
    await notifyUser(user._id, user.email, {
      type: "system",
      title: "Account Restored",
      message: "Your account has been restored and is now active.",
    });

    res.json({ user, message: "User unsuspended" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingCourses = async (_req, res) => {
  try {
    const courses = await Course.find({ status: "pending" }).populate("instructor", "fullName email");
    res.json({
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
    res.status(500).json({ message: error.message });
  }
};

const getManagedCoursesHistory = async (_req, res) => {
  try {
    const courses = await Course.find({
      status: { $in: ["published", "rejected"] },
    }).populate("instructor", "fullName email");
    res.json({
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,
  unsuspendUser,
  getPendingCourses,
  getManagedCoursesHistory,
};
