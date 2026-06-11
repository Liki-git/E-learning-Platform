const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createOrUpdateReview, getCourseReviews, getMyReviews } = require("../controllers/reviewController");

const router = express.Router();

router.get("/my", protect, getMyReviews);
router.get("/course/:courseId", getCourseReviews);
router.post("/", protect, createOrUpdateReview);

module.exports = router;
