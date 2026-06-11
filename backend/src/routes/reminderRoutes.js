const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createReminder, getMyReminders } = require("../controllers/reminderController");

const router = express.Router();
router.use(protect);
router.post("/", createReminder);
router.get("/my", getMyReminders);

module.exports = router;
