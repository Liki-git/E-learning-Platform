const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    meetingUrl: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 }, // in minutes
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveClass", liveClassSchema);
