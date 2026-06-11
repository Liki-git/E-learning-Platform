const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Assignment = require("../models/Assignment");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { notifyUser } = require("../utils/notify");

const router = express.Router();
router.use(protect);

// Fetch assignments
router.get("/my", async (req, res) => {
  try {
    if (req.user.role === "instructor") {
      const assignments = await Assignment.find({ instructor: req.user._id })
        .populate("course", "title")
        .sort({ deadline: 1 });
      return res.json({ assignments });
    } else if (req.user.role === "admin") {
      const assignments = await Assignment.find()
        .populate("course", "title")
        .populate("instructor", "fullName")
        .sort({ deadline: 1 });
      return res.json({ assignments });
    } else {
      // Student: find active enrollments
      const enrollments = await Enrollment.find({ student: req.user._id, status: { $ne: "wishlist" } });
      const courseIds = enrollments.map((e) => e.course);
      const assignments = await Assignment.find({ course: { $in: courseIds } })
        .populate("course", "title")
        .populate("instructor", "fullName")
        .sort({ deadline: 1 });
      return res.json({ assignments });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Schedule a new assignment (instructor only)
router.post("/", authorize("instructor"), async (req, res) => {
  try {
    const { courseId, title, description, deadline, maxScore } = req.body;
    if (!courseId || !title || !deadline) {
      return res.status(400).json({ message: "Course, Title, and Deadline are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assignment = await Assignment.create({
      course: courseId,
      instructor: req.user._id,
      title,
      description,
      deadline: new Date(deadline),
      maxScore: maxScore || 100,
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
            title: "New Assignment Scheduled",
            message: `A new assignment "${title}" has been added for your course "${course.title}".`,
            link: `${clientUrl}/student/assignments`
          });
        }
        return Promise.resolve();
      })
    );

    res.status(201).json({ assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment (student only)
router.post("/:id/submit", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // Validate enrollment
    const isEnrolled = await Enrollment.findOne({ student: req.user._id, course: assignment.course, status: { $ne: "wishlist" } });
    if (!isEnrolled) {
      return res.status(403).json({ message: "You must be enrolled to submit this assignment" });
    }

    // Check if student already submitted
    const existingIdx = assignment.submissions.findIndex(s => String(s.student) === String(req.user._id));
    const submission = {
      student: req.user._id,
      content: req.body.content || "",
      fileUrl: req.body.fileUrl || "",
      submittedAt: new Date()
    };

    if (existingIdx !== -1) {
      assignment.submissions[existingIdx] = {
        ...assignment.submissions[existingIdx].toObject(),
        ...submission
      };
    } else {
      assignment.submissions.push(submission);
    }

    await assignment.save();
    res.json({ assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Grade/Feedback on submission (instructor only)
router.patch("/:id/grade", authorize("instructor"), async (req, res) => {
  try {
    const { studentId, score, feedback } = req.body;
    if (!studentId) return res.status(400).json({ message: "Student ID is required" });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (String(assignment.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const subIdx = assignment.submissions.findIndex(s => String(s.student) === String(studentId));
    if (subIdx === -1) {
      return res.status(404).json({ message: "Submission not found" });
    }

    assignment.submissions[subIdx].score = score;
    assignment.submissions[subIdx].feedback = feedback || "";
    await assignment.save();

    // Notify the student
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    await notifyUser(studentId, "", {
      type: "system",
      title: "Assignment Graded",
      message: `Your submission for "${assignment.title}" has been graded: ${score}/${assignment.maxScore}`,
      link: `${clientUrl}/student/assignments`
    });

    res.json({ assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
