const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, default: 0 },
});

const quizSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, default: "" }, // Store name for instructor view
  studentEmail: { type: String, default: "" }, // Store email for instructor contact
  answers: [{ type: Number }], // Student's selected option indexes
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  canViewAnswers: { type: Boolean, default: false }, // Allow student to see answers after submission
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    questions: [questionSchema],
    passingScore: { type: Number, default: 70 },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submissions: [quizSubmissionSchema],
    maxAttempts: { type: Number, default: 1 }, // 1 = no retake, unlimited = many attempts
    dueDate: { type: Date },
  },
  { timestamps: true }
);

// Index for faster queries
quizSchema.index({ course: 1, instructor: 1 });
quizSchema.index({ "submissions.student": 1 });

module.exports = mongoose.model("Quiz", quizSchema);
