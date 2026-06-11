const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Assignment = require("../models/Assignment");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");
const { notifyUser } = require("../utils/notify");

const router = express.Router();
router.use(protect);

/**
 * GET /api/assignments/my - Get student's assignments or instructor's assignments
 */
router.get("/my", async (req, res) => {
  try {
    if (req.user.role === "instructor") {
      // Get all assignments with student submission details
      const assignments = await Assignment.find({
        instructor: req.user._id,
      })
        .populate("course", "title")
        .populate("submissions.student", "fullName email")
        .sort({ deadline: 1 });
      
      return res.json({
        success: true,
        assignments: assignments.map((a) => ({
          ...a.toObject(),
          studentCount: a.submissions.length,
          gradedCount: a.submissions.filter((s) => s.status === "graded").length,
          pendingCount: a.submissions.filter((s) => s.status === "pending").length,
        })),
      });
    } else if (req.user.role === "admin") {
      const assignments = await Assignment.find()
        .populate("course", "title")
        .populate("instructor", "fullName")
        .populate("submissions.student", "fullName email")
        .sort({ deadline: 1 });
      return res.json({ success: true, assignments });
    } else {
      // Student: find active enrollments
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: { $ne: "wishlist" },
      });
      const courseIds = enrollments.map((e) => e.course);
      const assignments = await Assignment.find({
        course: { $in: courseIds },
      })
        .populate("course", "title")
        .populate("instructor", "fullName")
        .sort({ deadline: 1 });
      return res.json({ success: true, assignments });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/assignments/:id - Get single assignment
 */
router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("course", "title")
      .populate("submissions.student", "fullName email");
    
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });

    // Instructor view with all submissions and student names
    if (
      req.user.role === "instructor" &&
      String(assignment.instructor) === String(req.user._id)
    ) {
      return res.json({
        success: true,
        assignment: {
          ...assignment.toObject(),
          submissions: assignment.submissions.map((s) => ({
            ...s.toObject(),
            studentName: s.studentName || "Unknown",
            studentEmail: s.studentEmail,
          })),
        },
      });
    }

    if (req.user.role === "admin") {
      return res.json({ success: true, assignment });
    }

    // Student view - only show their submission
    const isEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course._id || assignment.course,
      status: { $ne: "wishlist" },
    });
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled to view this assignment",
      });
    }

    const mySubmission = assignment.submissions.find(
      (s) => String(s.student) === String(req.user._id)
    );

    res.json({
      success: true,
      assignment: {
        ...assignment.toObject(),
        mySubmission: mySubmission || null,
        submissions: [], // Hide other student submissions
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/assignments - Create assignment (instructor only)
 */
router.post("/", authorize("instructor"), async (req, res) => {
  try {
    const { courseId, title, description, deadline, maxScore, allowResubmit } =
      req.body;
    
    if (!courseId || !title || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Course, Title, and Deadline are required",
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

    const assignment = await Assignment.create({
      course: courseId,
      instructor: req.user._id,
      title,
      description,
      deadline: new Date(deadline),
      maxScore: maxScore || 100,
      allowResubmit: allowResubmit !== false, // default true
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
            title: "New Assignment Available",
            message: `A new assignment "${title}" has been added for your course "${course.title}".`,
            link: `${clientUrl}/student/assignments/${assignment._id}`,
          });
        }
        return Promise.resolve();
      })
    );

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/assignments/:id/submit - Submit assignment (student only)
 */
router.post("/:id/submit", async (req, res) => {
  try {
    const { content, fileUrl } = req.body;
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });

    // Validate enrollment
    const isEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course,
      status: { $ne: "wishlist" },
    });
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled to submit this assignment",
      });
    }

    const student = await User.findById(req.user._id);

    // Check if student already submitted
    const existingIdx = assignment.submissions.findIndex(
      (s) => String(s.student) === String(req.user._id)
    );

    const submission = {
      student: req.user._id,
      studentName: student.fullName,
      studentEmail: student.email,
      content: content || "",
      fileUrl: fileUrl || "",
      status: "pending",
      submittedAt: new Date(),
    };

    if (existingIdx !== -1) {
      // Update existing submission
      assignment.submissions[existingIdx] = {
        ...assignment.submissions[existingIdx].toObject(),
        ...submission,
      };
    } else {
      assignment.submissions.push(submission);
    }

    await assignment.save();

    // Notify instructor
    const instructor = await User.findById(assignment.instructor);
    await notifyUser(assignment.instructor, instructor.email, {
      type: "system",
      title: "New Assignment Submission",
      message: `${student.fullName} submitted the assignment "${assignment.title}".`,
      link: `${process.env.CLIENT_URL || "http://localhost:5173"}/instructor/assignments/${assignment._id}`,
    });

    res.json({ success: true, message: "Assignment submitted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/assignments/:id/grade - Grade assignment submission (instructor only)
 * Syncs immediately to student portal
 */
router.patch("/:id/grade", authorize("instructor"), async (req, res) => {
  try {
    const { studentId, score, feedback } = req.body;
    if (!studentId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Score are required",
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    
    if (String(assignment.instructor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const subIdx = assignment.submissions.findIndex(
      (s) => String(s.student) === String(studentId)
    );
    if (subIdx === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    // Update submission with grading info
    assignment.submissions[subIdx].score = score;
    assignment.submissions[subIdx].feedback = feedback || "";
    assignment.submissions[subIdx].status = "graded";
    assignment.submissions[subIdx].gradedAt = new Date();
    assignment.submissions[subIdx].gradedBy = req.user._id;

    await assignment.save();

    // Immediately notify the student
    const student = await User.findById(studentId);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    
    await notifyUser(studentId, student.email, {
      type: "system",
      title: "Assignment Graded",
      message: `Your submission for "${assignment.title}" has been graded: ${score}/${assignment.maxScore}${feedback ? `. Feedback: ${feedback}` : ""}`,
      link: `${clientUrl}/student/assignments/${assignment._id}`,
    });

    res.json({
      success: true,
      message: "Assignment graded and student notified",
      submission: assignment.submissions[subIdx],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/assignments/:id/submissions - Get all submissions (instructor only)
 */
router.get("/:id/submissions", authorize("instructor"), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate(
      "submissions.student",
      "fullName email"
    );
    
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    
    if (String(assignment.instructor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({
      success: true,
      submissions: assignment.submissions.map((s) => ({
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
 * PATCH /api/assignments/:id - Update assignment (instructor only)
 */
router.patch("/:id", authorize("instructor"), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    
    if (String(assignment.instructor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Update allowed fields
    const allowedFields = [
      "title",
      "description",
      "deadline",
      "maxScore",
      "allowResubmit",
    ];
    
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        assignment[field] = req.body[field];
      }
    });

    await assignment.save();
    
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
