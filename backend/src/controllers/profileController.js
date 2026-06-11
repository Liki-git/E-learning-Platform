const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendPasswordChangeOtpEmail, sendSecurityAlertEmail } = require("../utils/email");

const safeProfile = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  role: user.role,
  profilePic: user.profilePic || "",
  bio: user.bio || "",
  learningStreak: user.learningStreak || 0,
  attendanceDates: user.attendanceDates || [],
  themePreference: user.themePreference || "light",
});

const getProfile = async (req, res) => {
  res.json({ user: safeProfile(req.user) });
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, profilePic, email, username, themePreference } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (profilePic !== undefined) updates.profilePic = profilePic;
    if (email) updates.email = email.toLowerCase();
    if (username) updates.username = username.toLowerCase();
    if (themePreference && ["light", "dark"].includes(themePreference)) {
      updates.themePreference = themePreference;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ user: safeProfile(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email or username already taken" });
    }
    res.status(400).json({ message: error.message });
  }
};

const sendPasswordOtp = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendPasswordChangeOtpEmail(email, otp);
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  try {
    const { otp, password, confirmPassword } = req.body;
    if (!otp || !password || !confirmPassword) {
      return res.status(400).json({ message: "OTP and new password are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const email = req.user.email.toLowerCase();
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.user._id, { password: hashed });
    await Otp.deleteMany({ email });

    await sendSecurityAlertEmail(email, "Password changed from settings");

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  sendPasswordOtp,
  resetPasswordWithOtp,
  safeProfile,
};
