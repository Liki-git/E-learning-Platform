const mongoose = require("mongoose");

const qnaReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const qAndASchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studentName: { type: String, required: true },
    question: { type: String, required: true },
    replies: [qnaReplySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("QandA", qAndASchema);
