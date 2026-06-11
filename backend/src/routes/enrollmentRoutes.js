const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  enroll,
  addWishlist,
  removeWishlist,
  getMyEnrollments,
  getRecentActivity,
  updateProgress,
  getCourseStudents,
} = require("../controllers/enrollmentController");

const router = express.Router();

router.use(protect);

router.get("/my", authorize("student"), getMyEnrollments);
router.get("/recent", authorize("student"), getRecentActivity);
router.post("/:courseId/enroll", authorize("student"), enroll);
router.post("/:courseId/wishlist", authorize("student"), addWishlist);
router.delete("/:courseId/wishlist", authorize("student"), removeWishlist);
router.patch("/:courseId/progress", authorize("student"), updateProgress);
router.get("/:courseId/students", authorize("instructor", "admin"), getCourseStudents);

module.exports = router;
