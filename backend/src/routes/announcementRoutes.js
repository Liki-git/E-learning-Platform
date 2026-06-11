const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Announcement = require("../models/Announcement");
const User = require("../models/User");
const { notifyUser } = require("../utils/notify");

const router = express.Router();
router.use(protect);

// Fetch all announcements
router.get("/", async (_req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create announcement (admin only)
router.post("/", authorize("admin"), async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const announcement = await Announcement.create({
      title,
      message,
      createdBy: req.user._id
    });

    // Notify all users about the new announcement
    const users = await User.find({ isSuspended: false });
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    await Promise.all(
      users.map((u) => {
        return notifyUser(u._id, u.email, {
          type: "system",
          title: "New Platform Announcement",
          message: title,
          link: `${clientUrl}/student/dashboard`
        });
      })
    );

    res.status(201).json({ announcement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark announcement as read
router.patch("/:id/read", async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    if (!announcement.readBy.includes(req.user._id)) {
      announcement.readBy.push(req.user._id);
      await announcement.save();
    }

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete announcement (admin only)
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
