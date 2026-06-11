const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  studentDashboard,
  instructorDashboard,
  adminDashboard,
} = require("../controllers/dashboardController");

const router = express.Router();

router.use(protect);
router.get("/student", authorize("student"), studentDashboard);
router.get("/instructor", authorize("instructor"), instructorDashboard);
router.get("/admin", authorize("admin"), adminDashboard);

module.exports = router;
