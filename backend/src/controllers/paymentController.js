const crypto = require("crypto");
const Enrollment = require("../models/Enrollment");
const Payment = require("../models/Payment");
const Course = require("../models/Course");
const User = require("../models/User");
const { notifyUser, notifyAdmins } = require("../utils/notify");

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

let Razorpay;
try {
  Razorpay = require("razorpay");
} catch {
  Razorpay = null;
}

const getRazorpay = () => {
  if (!Razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const completePayment = async (enrollment, course, student, amount, transactionId, method) => {
  const payment = await Payment.create({
    enrollment: enrollment._id,
    student: student._id,
    course: course._id,
    amount,
    method,
    status: "success",
    transactionId,
  });

  enrollment.paymentStatus = "paid";
  enrollment.status = "active";
  await enrollment.save();

  await notifyUser(student._id, student.email, {
    type: "payment",
    title: "Payment successful",
    message: `Payment of ₹${amount} for "${course.title}" was successful. Transaction: ${transactionId}`,
    link: `${clientUrl}/student/learn/${course._id}`,
  });

  const instructor = await User.findById(course.instructor);
  if (instructor) {
    await notifyUser(instructor._id, instructor.email, {
      type: "payment",
      title: "New course payment",
      message: `${student.fullName} paid ₹${amount} for your course "${course.title}".`,
      link: `${clientUrl}/instructor/dashboard`,
    });
  }

  return payment;
};

const createRazorpayOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(400).json({ message: "Enroll first" });

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.json({ mode: "simulated", amount: course.price, courseId });
    }

    const order = await razorpay.orders.create({
      amount: course.price * 100,
      currency: "INR",
      receipt: `course_${courseId}_${Date.now()}`,
    });

    res.json({
      mode: "razorpay",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      courseId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { courseId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(400).json({ message: "Razorpay not configured" });

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const course = await Course.findById(courseId);
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!course || !enrollment) return res.status(404).json({ message: "Not found" });

    const payment = await completePayment(
      enrollment,
      course,
      req.user,
      course.price,
      razorpay_payment_id,
      "razorpay"
    );

    res.json({ message: "Payment verified", payment, enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkout = async (req, res) => {
  try {
    const { courseId, method } = req.body;
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Course not found" });
    }

    let enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        student: req.user._id,
        course: courseId,
        status: "enrolled",
        paymentStatus: course.price === 0 ? "free" : "unpaid",
      });
    }

    if (enrollment.paymentStatus === "paid" || enrollment.paymentStatus === "free") {
      return res.json({ message: "Already paid", enrollment });
    }

    if (course.price === 0) {
      enrollment.paymentStatus = "free";
      enrollment.status = "active";
      await enrollment.save();
      return res.json({ message: "Free course activated", enrollment });
    }

    if (getRazorpay() && method === "razorpay") {
      return createRazorpayOrder(req, res);
    }

    const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const payment = await completePayment(enrollment, course, req.user, course.price, transactionId, method || "card");

    res.json({
      message: "Payment successful",
      mode: "simulated",
      payment: {
        id: payment._id,
        amount: payment.amount,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
      },
      enrollment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const { resolveCourseImage } = require("../utils/courseImage");
    const payments = await Payment.find({ student: req.user._id, status: "success" })
      .populate("course", "title image category price")
      .sort({ paidAt: -1 });

    res.json({
      payments: payments.map((p) => ({
        _id: p._id,
        id: p._id,
        amount: p.amount,
        transactionId: p.transactionId,
        method: p.method,
        paidAt: p.paidAt,
        course: p.course
          ? {
              _id: p.course._id,
              id: p.course._id,
              title: p.course.title,
              image: resolveCourseImage(p.course.image, p.course.category, p.course.title),
              price: p.course.price,
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkout, getMyPayments, createRazorpayOrder, verifyRazorpayPayment };
