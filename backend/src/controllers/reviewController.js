const Review = require("../models/Review");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const updateCourseRating = async (courseId) => {
  const reviews = await Review.find({ course: courseId });
  if (reviews.length === 0) {
    await Course.findByIdAndUpdate(courseId, { rating: 0, reviewCount: 0 });
  } else {
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = Math.round((sum / reviews.length) * 10) / 10;
    await Course.findByIdAndUpdate(courseId, { rating: avg, reviewCount: reviews.length });
  }
};

const createOrUpdateReview = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    if (!courseId || !rating) {
      return res.status(400).json({ message: "Course ID and rating are required" });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ["enrolled", "active", "completed"] },
    });
    if (!enrollment) {
      return res.status(403).json({ message: "You must be enrolled in the course to write a review" });
    }

    // Create or update review
    const review = await Review.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      {
        student: req.user._id,
        studentName: req.user.fullName,
        course: courseId,
        rating: Number(rating),
        comment: comment || "",
      },
      { new: true, upsert: true }
    );

    await updateCourseRating(courseId);

    const updatedCourse = await Course.findById(courseId).select("rating reviewCount title");

    res.status(201).json({
      review,
      course: {
        id: updatedCourse._id,
        rating: updatedCourse.rating,
        reviewCount: updatedCourse.reviewCount,
        title: updatedCourse.title,
      },
      message: "Review submitted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId }).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyReviews = async (req, res) => {
  try {
    if (req.user.role === "instructor") {
      const courses = await Course.find({ instructor: req.user._id });
      const courseIds = courses.map(c => c._id);
      const reviews = await Review.find({ course: { $in: courseIds } })
        .populate("course", "title")
        .sort({ createdAt: -1 });
      res.json({ reviews });
    } else if (req.user.role === "student") {
      const reviews = await Review.find({ student: req.user._id })
        .populate("course", "title")
        .sort({ createdAt: -1 });
      res.json({ reviews });
    } else {
      const reviews = await Review.find()
        .populate("course", "title")
        .sort({ createdAt: -1 });
      res.json({ reviews });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrUpdateReview, getCourseReviews, getMyReviews };
