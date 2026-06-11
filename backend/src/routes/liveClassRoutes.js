const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const LiveClass = require("../models/LiveClass");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { notifyUser } = require("../utils/notify");

const router = express.Router();
router.use(protect);

// Fetch scheduled live classes
router.get("/my", async (req, res) => {
  try {
    if (req.user.role === "instructor") {
      const classes = await LiveClass.find({ instructor: req.user._id })
        .populate("course", "title")
        .sort({ scheduledAt: 1 });
      return res.json({ classes });
    } else if (req.user.role === "admin") {
      const classes = await LiveClass.find()
        .populate("course", "title")
        .populate("instructor", "fullName")
        .sort({ scheduledAt: 1 });
      return res.json({ classes });
    } else {
      // Student: find active enrollments
      const enrollments = await Enrollment.find({ student: req.user._id, status: { $ne: "wishlist" } });
      const courseIds = enrollments.map((e) => e.course);
      const classes = await LiveClass.find({ course: { $in: courseIds } })
        .populate("course", "title")
        .populate("instructor", "fullName")
        .sort({ scheduledAt: 1 });
      return res.json({ classes });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Schedule a new live class (instructor only)
router.post("/", authorize("instructor"), async (req, res) => {
  try {
    const { courseId, title, description, meetingUrl, scheduledAt, duration } = req.body;
    if (!courseId || !title || !meetingUrl || !scheduledAt) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const liveClass = await LiveClass.create({
      course: courseId,
      instructor: req.user._id,
      title,
      description,
      meetingUrl,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60
    });

    // Notify all enrolled students in real time
    const enrollments = await Enrollment.find({ course: courseId, status: { $ne: "wishlist" } }).populate("student");
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    
    await Promise.all(
      enrollments.map((enr) => {
        if (enr.student) {
          return notifyUser(enr.student._id, enr.student.email, {
            type: "system",
            title: "New Live Class Scheduled",
            message: `A live class "${title}" has been scheduled for your course "${course.title}".`,
            link: `${clientUrl}/student/live-classes`
          });
        }
        return Promise.resolve();
      })
    );

    res.status(201).json({ liveClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel/Delete a live class
router.delete("/:id", async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ message: "Live class not found" });

    // Verify ownership
    if (String(liveClass.instructor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await LiveClass.findByIdAndDelete(req.params.id);
    res.json({ message: "Live class cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
