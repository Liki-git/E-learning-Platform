const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  checkout,
  getMyPayments,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

const router = express.Router();

router.use(protect);
router.post("/checkout", authorize("student"), checkout);
router.post("/razorpay/order", authorize("student"), createRazorpayOrder);
router.post("/razorpay/verify", authorize("student"), verifyRazorpayPayment);
router.get("/my", authorize("student"), getMyPayments);

module.exports = router;
