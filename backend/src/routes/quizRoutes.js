const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Quiz = require("../models/Quiz");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { notifyUser } = require("../utils/notify");

const router = express.Router();
router.use(protect);

const sanitizeQuizForStudent = (quiz, userId) => {
  const obj = quiz.toObject ? quiz.toObject() : { ...quiz };
  obj.questions = (obj.questions || []).map((q) => ({
    question: q.question,
    options: q.options,
  }));
  const mine = (obj.submissions || []).find((s) => String(s.student) === String(userId));
  obj.mySubmission = mine || null;
  delete obj.submissions;
  return obj;
};

// Fetch quizzes
router.get("/my", async (req, res) => {
  try {
    if (req.user.role === "instructor") {
      const quizzes = await Quiz.find({ instructor: req.user._id })
        .populate("course", "title")
        .sort({ createdAt: -1 });
      return res.json({ quizzes });
    } else if (req.user.role === "admin") {
      const quizzes = await Quiz.find()
        .populate("course", "title")
        .populate("instructor", "fullName")
        .sort({ createdAt: -1 });
      return res.json({ quizzes });
    } else {
      const enrollments = await Enrollment.find({ student: req.user._id, status: { $ne: "wishlist" } });
      const courseIds = enrollments.map((e) => e.course);
      const quizzes = await Quiz.find({ course: { $in: courseIds } })
        .populate("course", "title")
        .populate("instructor", "fullName")
        .sort({ createdAt: -1 });
      return res.json({
        quizzes: quizzes.map((q) => sanitizeQuizForStudent(q, req.user._id)),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("course", "title");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (req.user.role === "instructor" && String(quiz.instructor) === String(req.user._id)) {
      return res.json({ quiz });
    }
    if (req.user.role === "admin") {
      return res.json({ quiz });
    }

    const isEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course._id || quiz.course,
      status: { $ne: "wishlist" },
    });
    if (!isEnrolled) {
      return res.status(403).json({ message: "You must be enrolled to take this quiz" });
    }

    res.json({ quiz: sanitizeQuizForStudent(quiz, req.user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Schedule/create a new quiz (instructor only)
router.post("/", authorize("instructor"), async (req, res) => {
  try {
    const { courseId, title, questions, passingScore } = req.body;
    if (!courseId || !title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Course, Title, and Questions are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const quiz = await Quiz.create({
      course: courseId,
      instructor: req.user._id,
      title,
      questions,
      passingScore: passingScore || 70,
      submissions: []
    });

    // Notify all enrolled students
    const enrollments = await Enrollment.find({ course: courseId, status: { $ne: "wishlist" } }).populate("student");
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    await Promise.all(
      enrollments.map((enr) => {
        if (enr.student) {
          return notifyUser(enr.student._id, enr.student.email, {
            type: "system",
            title: "New Quiz Scheduled",
            message: `A new quiz "${title}" has been added for your course "${course.title}".`,
            link: `${clientUrl}/student/quizzes`
          });
        }
        return Promise.resolve();
      })
    );

    res.status(201).json({ quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit answers for grading (student only)
router.post("/:id/submit", async (req, res) => {
  try {
    const { answers } = req.body; // Array of selected options indexes: e.g. [0, 1, 2, 0]
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers are required" });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Validate enrollment
    const isEnrolled = await Enrollment.findOne({ student: req.user._id, course: quiz.course, status: { $ne: "wishlist" } });
    if (!isEnrolled) {
      return res.status(403).json({ message: "You must be enrolled to submit this quiz" });
    }

    // Grade the quiz
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && Number(answers[idx]) === q.correctIndex) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Check if student already submitted
    const existingIdx = quiz.submissions.findIndex(s => String(s.student) === String(req.user._id));
    const submission = {
      student: req.user._id,
      score,
      passed,
      submittedAt: new Date()
    };

    if (existingIdx !== -1) {
      // Keep the highest score
      if (score > quiz.submissions[existingIdx].score) {
        quiz.submissions[existingIdx] = submission;
      }
    } else {
      quiz.submissions.push(submission);
    }

    await quiz.save();
    res.json({ score, passed, totalQuestions: quiz.questions.length, correctCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
