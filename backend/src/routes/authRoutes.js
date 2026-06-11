const express = require("express");
const {
  signup,
  login,
  me,
  googleAuth,
  sendForgotOtp,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", protect, me);
router.post("/forgot-password", sendForgotOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
