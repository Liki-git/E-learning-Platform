const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Quiz = require("../models/Quiz");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");
const { notifyUser } = require("../utils/notify");

const router = express.Router();
router.use(protect);

/**
 * Sanitize quiz for student view
 * Hide correct answers and instructor details
 * Show only if student hasn't submitted or after submission with permission
 */
const sanitizeQuizForStudent = (quiz, userId, hasSubmitted) => {
  const obj = quiz.toObject ? quiz.toObject() : { ...quiz };
  
  // Hide correct answers from students unless they've submitted
  obj.questions = (obj.questions || []).map((q) => ({
    question: q.question,
    options: q.options,
    correctIndex: hasSubmitted ? q.correctIndex : undefined, // Only show correct answer after submission
  }));
  
  const mySubmission = (obj.submissions || []).find(
    (s) => String(s.student) === String(userId)
  );
  obj.mySubmission = mySubmission || null;
  obj.hasAttempted = !!mySubmission;
  obj.canRetake = !mySubmission || (quiz.maxAttempts > 1);
  
  // Don't return all submissions to student
  delete obj.submissions;
  
  return obj;
};

/**
 * GET /api/quizzes/my - Get student's quizzes or instructor's quizzes
 */
router.get("/my", async (req, res) => {
  try {
    if (req.user.role === "instructor") {
      // Get all quizzes created by this instructor with submission details
      const quizzes = await Quiz.find({ instructor: req.user._id })
        .populate("course", "title")
        .populate("submissions.student", "fullName email")
        .sort({ createdAt: -1 });
      
      return res.json({
        success: true,
        quizzes: quizzes.map((q) => ({
          ...q.toObject(),
          studentCount: q.submissions.length,
          averageScore:
            q.submissions.length > 0
              ? Math.round(
                  q.submissions.reduce((sum, s) => sum + s.score, 0) /
                    q.submissions.length
                )
              : 0,
        })),
      });
    } else if (req.user.role === "admin") {
      const quizzes = await Quiz.find()
        .populate("course", "title")
        .populate("instructor", "fullName")
        .populate("submissions.student", "fullName email")
        .sort({ createdAt: -1 });
      return res.json({ success: true, quizzes });
    } else {
      // Student: get quizzes from enrolled courses
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: { $ne: "wishlist" },
      });
      const courseIds = enrollments.map((e) => e.course);
      const quizzes = await Quiz.find({ course: { $in: courseIds } })
        .populate("course", "title")
        .populate("instructor", "fullName")
        .sort({ createdAt: -1 });
      return res.json({
        success: true,
        quizzes: quizzes.map((q) => sanitizeQuizForStudent(q, req.user._id, false)),
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/quizzes/:id - Get single quiz
 */
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("course", "title")
      .populate("submissions.student", "fullName email");
    
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    // Instructor or Admin can see full details
    if (
      req.user.role === "instructor" &&
      String(quiz.instructor) === String(req.user._id)
    ) {
      return res.json({ success: true, quiz });
    }
    if (req.user.role === "admin") {
      return res.json({ success: true, quiz });
    }

    // Student must be enrolled
    const isEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course._id || quiz.course,
      status: { $ne: "wishlist" },
    });
    if (!isEnrolled) {
      return res
        .status(403)
        .json({ success: false, message: "You must be enrolled to take this quiz" });
    }

    const mySubmission = quiz.submissions.find(
      (s) => String(s.student) === String(req.user._id)
    );

    res.json({
      success: true,
      quiz: sanitizeQuizForStudent(quiz, req.user._id, !!mySubmission),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/quizzes - Create a new quiz (instructor only)
 */
router.post("/", authorize("instructor"), async (req, res) => {
  try {
    const { courseId, title, description, questions, passingScore, dueDate, maxAttempts } =
      req.body;
    
    if (!courseId || !title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "Course, Title, and Questions are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const quiz = await Quiz.create({
      course: courseId,
      instructor: req.user._id,
      title,
      description,
      questions,
      passingScore: passingScore || 70,
      dueDate: dueDate ? new Date(dueDate) : null,
      maxAttempts: maxAttempts || 1,
      submissions: [],
    });

    // Notify all enrolled students
    const enrollments = await Enrollment.find({
      course: courseId,
      status: { $ne: "wishlist" },
    }).populate("student");
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    await Promise.all(
      enrollments.map((enr) => {
        if (enr.student) {
          return notifyUser(enr.student._id, enr.student.email, {
            type: "system",
            title: "New Quiz Available",
            message: `A new quiz "${title}" has been added for your course "${course.title}".`,
            link: `${clientUrl}/student/quizzes/${quiz._id}`,
          });
        }
        return Promise.resolve();
      })
    );

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/quizzes/:id/submit - Submit quiz answers (student only)
 * Prevents retakes if maxAttempts is 1
 */
router.post("/:id/submit", async (req, res) => {
  try {
    const { answers } = req.body; // Array of selected option indexes
    if (!answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ success: false, message: "Answers array is required" });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });

    // Validate enrollment
    const isEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course,
      status: { $ne: "wishlist" },
    });
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled to submit this quiz",
      });
    }

    // Check if student already submitted (and maxAttempts is 1)
    const existingSubmission = quiz.submissions.find(
      (s) => String(s.student) === String(req.user._id)
    );

    if (existingSubmission && quiz.maxAttempts === 1) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this quiz. Retakes are not allowed.",
      });
    }

    // Grade the quiz
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (
        answers[idx] !== undefined &&
        Number(answers[idx]) === q.correctIndex
      ) {
        correctCount += 1;
      }
    });

    const score = Math.round(
      (correctCount / quiz.questions.length) * 100
    );
    const passed = score >= quiz.passingScore;

    // Get student info
    const student = await User.findById(req.user._id);

    const submission = {
      student: req.user._id,
      studentName: student.fullName,
      studentEmail: student.email,
      answers, // Store answers for future reference
      score,
      passed,
      canViewAnswers: true, // Allow viewing answers after submission
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    if (existingSubmission) {
      // Update existing submission (for retakes)
      const idx = quiz.submissions.findIndex(
        (s) => String(s.student) === String(req.user._id)
      );
      quiz.submissions[idx] = submission;
    } else {
      quiz.submissions.push(submission);
    }

    await quiz.save();

    // Notify instructor
    const instructor = await User.findById(quiz.instructor);
    await notifyUser(quiz.instructor, instructor.email, {
      type: "system",
      title: "New Quiz Submission",
      message: `${student.fullName} submitted the quiz "${quiz.title}" with a score of ${score}%.`,
      link: `${process.env.CLIENT_URL || "http://localhost:5173"}/instructor/quizzes/${quiz._id}`,
    });

    res.json({
      success: true,
      score,
      passed,
      totalQuestions: quiz.questions.length,
      correctCount,
      message: `Quiz submitted! You scored ${score}% (${correctCount}/${quiz.questions.length} correct)`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/quizzes/:id/submissions - Get all submissions for a quiz (instructor only)
 */
router.get("/:id/submissions", authorize("instructor"), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "submissions.student",
      "fullName email"
    );
    
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    
    if (String(quiz.instructor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({
      success: true,
      submissions: quiz.submissions.map((s) => ({
        ...s.toObject(),
        studentName: s.studentName || "Unknown",
        studentEmail: s.studentEmail,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/quizzes/:id - Update quiz (instructor only)
 */
router.patch("/:id", authorize("instructor"), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    
    if (String(quiz.instructor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Update allowed fields
    const allowedFields = [
      "title",
      "description",
      "questions",
      "passingScore",
      "dueDate",
      "maxAttempts",
    ];
    
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        quiz[field] = req.body[field];
      }
    });

    await quiz.save();
    
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
