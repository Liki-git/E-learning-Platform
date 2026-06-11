const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  sendPasswordOtp,
  resetPasswordWithOtp,
} = require("../controllers/profileController");

const router = express.Router();
router.use(protect);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/password/send-otp", sendPasswordOtp);
router.patch("/password/reset", resetPasswordWithOtp);

module.exports = router;
