const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const { notifyUser } = require("../utils/notify");
const { resolveCourseImage } = require("../utils/courseImage");
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const formatEnrollment = (enrollment) => ({
  id: enrollment._id,
  course: enrollment.course,
  status: enrollment.status,
  paymentStatus: enrollment.paymentStatus,
  progress: enrollment.progress,
  learningHours: enrollment.learningHours,
  enrolledAt: enrollment.enrolledAt,
  completedAt: enrollment.completedAt,
  lastLessonId: enrollment.lastLessonId,
});

const enroll = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Course not available" });
    }

    let enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
    if (enrollment) {
      return res.json({ enrollment: formatEnrollment(enrollment), message: "Already enrolled" });
    }

    const isFree = course.price === 0;
    enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      status: "enrolled",
      paymentStatus: isFree ? "free" : "unpaid",
    });

    if (isFree) {
      enrollment.status = "active";
      await enrollment.save();
    }

    await notifyUser(req.user._id, req.user.email, {
      type: "enrollment",
      title: "Course enrolled",
      message: `You enrolled in "${course.title}". ${isFree ? "Start learning now!" : "Complete payment to unlock content."}`,
      link: `${clientUrl}/student/courses/${course._id}`,
    });

    res.status(201).json({ enrollment: formatEnrollment(enrollment) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Already enrolled" });
    }
    res.status(500).json({ message: error.message });
  }
};

const addWishlist = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    let enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
    if (enrollment) {
      return res.json({ enrollment: formatEnrollment(enrollment) });
    }

    enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      status: "wishlist",
      paymentStatus: "unpaid",
    });
    res.status(201).json({ enrollment: formatEnrollment(enrollment) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeWishlist = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndDelete({
      student: req.user._id,
      course: req.params.courseId,
      status: "wishlist",
    });
    if (!enrollment) return res.status(404).json({ message: "Not in wishlist" });
    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    const filter = { student: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const enrollments = await Enrollment.find(filter)
      .populate("course")
      .sort({ updatedAt: -1 });

    const formatted = enrollments.map((e) => ({
      ...formatEnrollment(e),
      course: e.course
        ? {
            id: e.course._id,
            title: e.course.title,
            image: resolveCourseImage(e.course.image, e.course.category, e.course.title),
            level: e.course.level,
            price: e.course.price,
            category: e.course.category,
            instructorName: e.course.instructorName,
            rating: e.course.rating,
          }
        : null,
    }));

    res.json({ enrollments: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const recordAttendance = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (!user.attendanceDates.includes(today)) {
    user.attendanceDates.push(today);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const lastDate = user.lastLearningDate
      ? user.lastLearningDate.toISOString().slice(0, 10)
      : null;
    if (lastDate === yStr) {
      user.learningStreak = (user.learningStreak || 0) + 1;
    } else if (lastDate !== today) {
      user.learningStreak = 1;
    }
    user.lastLearningDate = new Date();
    await user.save();
  }
  return user;
};

const getRecentActivity = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: { $ne: "wishlist" },
    })
      .populate("course")
      .sort({ enrolledAt: -1 })
      .limit(6);

    res.json({
      activity: enrollments.map((e) => ({
        id: e._id,
        enrolledAt: e.enrolledAt,
        progress: e.progress,
        status: e.status,
        course: e.course
          ? {
              id: e.course._id,
              title: e.course.title,
              image: resolveCourseImage(e.course.image, e.course.category, e.course.title),
              instructorName: e.course.instructorName,
              instructorAvatar: e.course.instructorAvatar,
              category: e.course.category,
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProgress = async (req, res) => {
  try {
    const attendanceUser = await recordAttendance(req.user._id);
    const { lessonId, progress, hours } = req.body;
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
      paymentStatus: { $in: ["paid", "free"] },
    });
    if (!enrollment) return res.status(404).json({ message: "Active enrollment not found" });

    if (lessonId && !enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }
    if (typeof progress === "number") enrollment.progress = Math.min(100, progress);
    if (hours) enrollment.learningHours += hours;
    if (lessonId) enrollment.lastLessonId = lessonId;
    if (enrollment.progress >= 100) {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();

      const course = await Course.findById(req.params.courseId);
      const existing = await Certificate.findOne({ student: req.user._id, course: req.params.courseId });
      if (!existing && course) {
        const cert = await Certificate.create({ student: req.user._id, course: course._id });
        await notifyUser(req.user._id, req.user.email, {
          type: "certificate",
          title: "Certificate earned!",
          message: `Congratulations! You completed "${course.title}" and earned a certificate.`,
          link: `${clientUrl}/student/dashboard`,
        });
        res.json({
          enrollment: formatEnrollment(enrollment),
          certificateId: cert.certificateId,
          streak: attendanceUser?.learningStreak || req.user.learningStreak || 0,
          attendanceDates: attendanceUser?.attendanceDates || [],
        });
        return;
      }
    }
    await enrollment.save();
    const freshUser = attendanceUser || (await User.findById(req.user._id));
    res.json({
      enrollment: formatEnrollment(enrollment),
      streak: freshUser?.learningStreak || 0,
      attendanceDates: freshUser?.attendanceDates || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const enrollments = await Enrollment.find({
      course: course._id,
      status: { $ne: "wishlist" },
    }).populate("student", "fullName email username");

    res.json({
      students: enrollments.map((e) => ({
        id: e.student._id,
        fullName: e.student.fullName,
        email: e.student.email,
        progress: e.progress,
        paymentStatus: e.paymentStatus,
        enrolledAt: e.enrolledAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  enroll,
  addWishlist,
  removeWishlist,
  getMyEnrollments,
  getRecentActivity,
  updateProgress,
  getCourseStudents,
};
