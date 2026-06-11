const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const SupportTicket = require("../models/SupportTicket");
const { notifyAdmins, notifyUser } = require("../utils/notify");

const router = express.Router();
router.use(protect);

router.post("/", async (req, res) => {
  try {
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject: req.body.subject,
      message: req.body.message,
      priority: req.body.priority || "medium",
      replies: [{
        sender: req.user._id,
        senderName: req.user.fullName,
        message: req.body.message,
        createdAt: new Date()
      }]
    });
    await notifyAdmins(
      "New support query",
      `${req.user.fullName}: ${req.body.subject}`,
      "/admin/dashboard"
    );
    res.status(201).json({ ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my", async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", authorize("admin"), async (_req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id", authorize("admin"), async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/reply", async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Verify authorization
    if (String(ticket.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reply = {
      sender: req.user._id,
      senderName: req.user.fullName,
      message: req.body.message,
      createdAt: new Date()
    };

    ticket.replies.push(reply);

    if (req.user.role === "admin") {
      ticket.status = "in_progress";
      ticket.adminReply = req.body.message;
      // Notify the user who opened the ticket
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      await notifyUser(ticket.user, "", {
        type: "system",
        title: "New reply from Admin",
        message: `Admin has replied to your query: "${ticket.subject}"`,
        link: `${clientUrl}/student/messages`
      });
    } else {
      ticket.status = "open";
      await notifyAdmins(
        "New reply on support query",
        `${req.user.fullName} replied on "${ticket.subject}"`,
        "/admin/dashboard"
      );
    }

    await ticket.save();
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
