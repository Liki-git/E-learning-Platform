const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const FAQ = [
  {
    keys: ["enroll", "enrollment", "join course", "sign up course"],
    reply: "Browse courses from the Courses page, open a course, and click Enroll. Free courses unlock instantly; paid courses go to checkout first.",
  },
  {
    keys: ["certificate", "certificates", "complete"],
    reply: "Complete 100% of a course to earn a certificate. Check My Learning → Certificates tab or your dashboard.",
  },
  {
    keys: ["payment", "pay", "purchase", "refund"],
    reply: "After enrolling in a paid course, complete payment on the checkout page. View receipts under Profile → My Purchases.",
  },
  {
    keys: ["assignment", "submit assignment", "homework"],
    reply: "Go to Assignments in the sidebar, open an assignment, and submit your answer or file URL before the deadline.",
  },
  {
    keys: ["quiz", "test", "exam"],
    reply: "Open Quizzes in the sidebar, select a quiz, answer all questions, and submit. Your highest score is saved.",
  },
  {
    keys: ["live", "webinar", "class", "meeting"],
    reply: "Check Live Classes for scheduled sessions. Click Join when the class starts to open the meeting link.",
  },
  {
    keys: ["password", "reset", "forgot"],
    reply: "Use Forgot Password on the login page, or change password in Settings with an email OTP.",
  },
  {
    keys: ["support", "help", "contact"],
    reply: "Open Messages in the sidebar to create a support ticket, or visit Help Center on the homepage contact section.",
  },
];

const matchFaq = (text) => {
  const lower = text.toLowerCase();
  for (const item of FAQ) {
    if (item.keys.some((k) => lower.includes(k))) return item.reply;
  }
  return null;
};

const chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const text = message.trim();
    const faq = matchFaq(text);
    if (faq) {
      return res.json({ reply: faq, source: "faq" });
    }

    if (req.user?.role === "student") {
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: { $ne: "wishlist" },
      }).populate("course", "title");

      if (/my courses|enrolled|learning progress/i.test(text)) {
        if (enrollments.length === 0) {
          return res.json({
            reply: "You are not enrolled in any courses yet. Visit Courses to get started!",
            source: "enrollments",
          });
        }
        const list = enrollments
          .slice(0, 5)
          .map((e) => `• ${e.course?.title || "Course"} (${e.progress || 0}% complete)`)
          .join("\n");
        return res.json({
          reply: `Here are your recent courses:\n${list}\n\nOpen My Learning for full details.`,
          source: "enrollments",
        });
      }
    }

    if (/course|learn|study|recommend/i.test(text)) {
      const courses = await Course.find({ status: "published" })
        .sort({ rating: -1 })
        .limit(3)
        .select("title category level price rating");
      if (courses.length) {
        const list = courses
          .map((c) => `• ${c.title} (${c.category}, ${c.level}) — ★${c.rating}`)
          .join("\n");
        return res.json({
          reply: `Popular courses you might like:\n${list}\n\nBrowse all courses on the Courses page.`,
          source: "courses",
        });
      }
    }

    res.json({
      reply:
        "I'm LISHA Academy Assistant. I can help with enrollments, payments, assignments, quizzes, live classes, and certificates. Try asking: \"How do I enroll?\" or \"Show my courses\".",
      source: "default",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { chat };
