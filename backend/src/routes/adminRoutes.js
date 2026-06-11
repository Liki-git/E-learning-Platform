const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getPendingCourses,
  getManagedCoursesHistory,
} = require("../controllers/adminController");
const { approveCourse, rejectCourse } = require("../controllers/courseController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/courses/pending", getPendingCourses);
router.get("/courses/history", getManagedCoursesHistory);
router.post("/courses/:id/approve", approveCourse);
router.post("/courses/:id/reject", rejectCourse);

module.exports = router;
