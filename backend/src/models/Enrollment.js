const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    status: {
      type: String,
      enum: ["wishlist", "enrolled", "active", "completed"],
      default: "enrolled",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "free"],
      default: "unpaid",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: String }],
    learningHours: { type: Number, default: 0 },
    lastLessonId: { type: String, default: "" },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
