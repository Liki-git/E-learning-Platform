const express = require("express");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourse,
  getCategories,
} = require("../controllers/courseController");

const router = express.Router();

router.get("/categories", optionalAuth, getCategories);
router.get("/", optionalAuth, getCourses);
router.get("/:id", optionalAuth, getCourseById);

router.use(protect);
router.post("/", authorize("instructor"), createCourse);
router.put("/:id", authorize("instructor", "admin"), updateCourse);
router.delete("/:id", authorize("instructor", "admin"), deleteCourse);
router.post("/:id/submit", authorize("instructor"), submitCourse);

module.exports = router;
