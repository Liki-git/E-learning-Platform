const mongoose = require("mongoose");

const learningReminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    remindAt: { type: Date, required: true },
    message: { type: String, default: "Time to start learning!" },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LearningReminder", learningReminderSchema);
