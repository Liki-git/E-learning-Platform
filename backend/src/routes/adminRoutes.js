const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserSuspension,
  getUserStats,
  getPendingCourses,
  getManagedCoursesHistory,
  getAuditLogs,
} = require("../controllers/adminController");
const { approveCourse, rejectCourse } = require("../controllers/courseController");

const router = express.Router();

// Apply authentication and authorization middleware
router.use(protect, authorize("admin"));

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/users - Get all users (with pagination, filtering, search)
 * Query params: role, search, page, limit, sortBy
 */
router.get("/users", getUsers);

/**
 * POST /api/admin/users - Create new user
 * Body: { fullName, email, username, password, role }
 */
router.post("/users", createUser);

/**
 * GET /api/admin/users/:id - Get specific user
 */
router.get("/users/:id", getUserById);

/**
 * PATCH /api/admin/users/:id - Update user details
 * Body: { fullName, email, username, role, isSuspended, password, etc. }
 */
router.patch("/users/:id", updateUser);

/**
 * DELETE /api/admin/users/:id - Delete user
 */
router.delete("/users/:id", deleteUser);

/**
 * PATCH /api/admin/users/:id/suspend - Suspend/Unsuspend user
 * Body: { suspend: true/false }
 */
router.patch("/users/:id/suspend", toggleUserSuspension);

/**
 * GET /api/admin/users/stats/overview - Get user statistics
 */
router.get("/users/stats/overview", getUserStats);

// ==================== COURSE MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/courses/pending - Get pending courses
 */
router.get("/courses/pending", getPendingCourses);

/**
 * GET /api/admin/courses/history - Get course management history
 */
router.get("/courses/history", getManagedCoursesHistory);

/**
 * POST /api/admin/courses/:id/approve - Approve course
 */
router.post("/courses/:id/approve", approveCourse);

/**
 * POST /api/admin/courses/:id/reject - Reject course
 * Body: { rejectionReason }
 */
router.post("/courses/:id/reject", rejectCourse);

// ==================== AUDIT & LOGS ====================

/**
 * GET /api/admin/audit-logs - Get audit logs
 */
router.get("/audit-logs", getAuditLogs);

module.exports = router;
