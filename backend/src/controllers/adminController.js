const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Course = require("../models/Course");

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
    const hashed = await bcrypt.hash(password || "password123", 10);
    const user = await User.create({ fullName, email, username, password: hashed, role });
    res.status(201).json({ user: { id: user._id, fullName, email, username, role: user.role } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
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
  getPendingCourses,
  getManagedCoursesHistory,
};
