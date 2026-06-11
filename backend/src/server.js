const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const supportRoutes = require("./routes/supportRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const qaRoutes = require("./routes/qaRoutes");
const liveClassRoutes = require("./routes/liveClassRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const seedIfEmpty = require("./utils/seedCourses");
const { startReminderScheduler } = require("./utils/reminderScheduler");

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      const allowed = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        process.env.CLIENT_URL,
      ].filter(Boolean);
      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in dev
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "LISHA Academy API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/qa", qaRoutes);
app.use("/api/live-classes", liveClassRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/chatbot", chatbotRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedIfEmpty();
  startReminderScheduler();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
