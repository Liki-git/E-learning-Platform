const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, default: "" }, // Store name for instructor view
  studentEmail: { type: String, default: "" }, // Store email for instructor contact
  content: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  score: { type: Number }, // null until graded
  feedback: { type: String, default: "" },
  status: { type: String, enum: ["pending", "graded"], default: "pending" },
  submittedAt: { type: Date, default: Date.now },
  gradedAt: { type: Date }, // When instructor graded it
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Which instructor graded it
});

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    deadline: { type: Date },
    maxScore: { type: Number, default: 100 },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submissions: [submissionSchema],
    allowResubmit: { type: Boolean, default: true }, // Allow students to resubmit after grading
  },
  { timestamps: true }
);

// Index for faster queries
assignmentSchema.index({ course: 1, instructor: 1 });
assignmentSchema.index({ "submissions.student": 1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
