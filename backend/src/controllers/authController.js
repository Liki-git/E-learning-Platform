const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Otp = require("../models/Otp");
const AuditLog = require("../models/AuditLog");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail, sendSecurityAlertEmail } = require("../utils/email");
const crypto = require("crypto");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const safeUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  role: user.role,
  profilePic: user.profilePic || "",
  bio: user.bio || "",
  learningStreak: user.learningStreak || 0,
  themePreference: user.themePreference || "light",
});

const signup = async (req, res) => {
  try {
    const { fullName, email, username, password, role } = req.body;
    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? "email" : "username";
      return res.status(409).json({
        message: `An account with this ${field} already exists. Please try logging in instead.`,
        code: "ACCOUNT_EXISTS",
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      username,
      password: hashed,
      role: role || "student",
    });

    return res.status(201).json({
      message: "Account created successfully",
      token: generateToken(user._id),
      user: safeUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: "Role does not match this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: "Account suspended. Contact support." });
    }

    await AuditLog.create({
      user: user._id,
      email: user.email,
      action: "login",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
      userAgent: req.headers["user-agent"] || "",
    });

    await sendSecurityAlertEmail(user.email, "Successful login", {
      ip: req.ip || req.headers["x-forwarded-for"] || "",
    });

    return res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: safeUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google SSO is not configured on server" });
    }

    const { credential, role } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    const fullName = payload?.name || "Google User";
    const googleId = payload?.sub;

    if (!email || !googleId) {
      return res.status(401).json({ message: "Invalid Google token payload" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") || "user";
      let username = baseUsername.toLowerCase();
      let suffix = 1;

      while (await User.findOne({ username })) {
        username = `${baseUsername.toLowerCase()}${suffix}`;
        suffix += 1;
      }

      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashed = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        fullName,
        email,
        username,
        password: hashed,
        role: role || "student",
      });
    } else if (role && user.role !== role) {
      return res.status(401).json({ message: "Role does not match this account" });
    }

    await sendSecurityAlertEmail(user.email, "Successful login via Google");

    return res.json({
      message: "Google login successful",
      token: generateToken(user._id),
      user: safeUserResponse(user),
    });
  } catch (error) {
    console.error("Google SSO Auth error:", error);
    return res.status(500).json({ message: "Google login failed", error: error.message });
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

const sendForgotOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await Otp.deleteMany({ email: email.toLowerCase() });
    await Otp.create({
      email: email.toLowerCase(),
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpEmail(email.toLowerCase(), otp);
    return res.json({ message: "OTP sent to your email" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send OTP", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const record = await Otp.findOne({ email: email.toLowerCase(), code: otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    return res.json({ message: "OTP verified" });
  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;
    if (!email || !otp || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const record = await Otp.findOne({ email: email.toLowerCase(), code: otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { password: hashed });
    await Otp.deleteMany({ email: email.toLowerCase() });

    await sendSecurityAlertEmail(email.toLowerCase(), "Password reset completed");

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: "Password reset failed", error: error.message });
  }
};

module.exports = {
  signup,
  login,
  me,
  googleAuth,
  sendForgotOtp,
  verifyOtp,
  resetPassword,
};
