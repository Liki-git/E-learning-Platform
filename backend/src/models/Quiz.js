const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, default: 0 },
});

const quizSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    questions: [questionSchema],
    passingScore: { type: Number, default: 70 },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submissions: [quizSubmissionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
