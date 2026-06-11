const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  score: { type: Number },
  feedback: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
