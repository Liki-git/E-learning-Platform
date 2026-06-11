const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const QandA = require("../models/QandA");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { notifyUser } = require("../utils/notify");

const router = express.Router();
router.use(protect);

// All Q&A for instructor's courses (or all for admin)
router.get("/my", async (req, res) => {
  try {
    if (req.user.role === "instructor") {
      const courses = await Course.find({ instructor: req.user._id }).select("_id title");
      const courseIds = courses.map((c) => c._id);
      const questions = await QandA.find({ course: { $in: courseIds } })
        .populate("course", "title")
        .sort({ createdAt: -1 });
      return res.json({ questions, courses });
    }
    if (req.user.role === "admin") {
      const questions = await QandA.find()
        .populate("course", "title")
        .sort({ createdAt: -1 });
      return res.json({ questions, courses: [] });
    }
    // Student: fetch Q&A for enrolled courses
    if (req.user.role === "student") {
      const enrollments = await Enrollment.find({ student: req.user._id, status: { $ne: "wishlist" } });
      const courseIds = enrollments.map((e) => e.course);
      const questions = await QandA.find({ course: { $in: courseIds } })
        .populate("course", "title")
        .sort({ createdAt: -1 });
      const courses = await Course.find({ _id: { $in: courseIds } }).select("_id title");
      return res.json({ questions, courses });
    }
    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch all questions for a specific course
router.get("/course/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Validate enrollment/ownership
    const isInstructor = String(course.instructor) === String(req.user._id);
    const isEnrolled = await Enrollment.findOne({ student: req.user._id, course: course._id, status: { $ne: "wishlist" } });
    if (!isInstructor && !isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "You must be enrolled to view Q&A" });
    }

    const questions = await QandA.find({ course: course._id }).sort({ createdAt: -1 });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ask a question in a course
router.post("/course/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Validate enrollment
    const isEnrolled = await Enrollment.findOne({ student: req.user._id, course: course._id, status: { $ne: "wishlist" } });
    if (!isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "You must be enrolled to ask a question" });
    }

    const questionObj = await QandA.create({
      course: course._id,
      student: req.user._id,
      studentName: req.user.fullName,
      question: req.body.question,
      replies: []
    });

    // Notify course instructor
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    await notifyUser(course.instructor, "", {
      type: "system",
      title: "New Q&A Question",
      message: `Student ${req.user.fullName} asked a question in "${course.title}"`,
      link: `${clientUrl}/instructor/qa`
    });

    res.status(201).json({ question: questionObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reply to a question thread
router.post("/:id/reply", async (req, res) => {
  try {
    const questionObj = await QandA.findById(req.params.id);
    if (!questionObj) return res.status(404).json({ message: "Question thread not found" });

    const course = await Course.findById(questionObj.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Validate enrollment/instructor
    const isInstructor = String(course.instructor) === String(req.user._id);
    const isEnrolled = await Enrollment.findOne({ student: req.user._id, course: course._id, status: { $ne: "wishlist" } });
    if (!isInstructor && !isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reply = {
      user: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      message: req.body.message,
      createdAt: new Date()
    };

    questionObj.replies.push(reply);
    await questionObj.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    
    // If instructor replied, notify the student who asked
    if (isInstructor && String(questionObj.student) !== String(req.user._id)) {
      await notifyUser(questionObj.student, "", {
        type: "system",
        title: "Instructor Replied to Q&A",
        message: `Instructor ${req.user.fullName} replied to your question in "${course.title}"`,
        link: `${clientUrl}/student/qa`
      });
    }

    res.json({ question: questionObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
