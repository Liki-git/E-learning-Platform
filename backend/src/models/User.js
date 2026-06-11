const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" },
    learningStreak: { type: Number, default: 0 },
    lastLearningDate: { type: Date },
    attendanceDates: [{ type: String }],
    themePreference: { type: String, enum: ["light", "dark"], default: "light" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
