const LearningReminder = require("../models/LearningReminder");
const { notifyUser } = require("../utils/notify");
const { sendReminderEmail } = require("../utils/email");

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const buildRemindAt = (date, time) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const createReminder = async (req, res) => {
  try {
    const { date, time, message, courseId } = req.body;
    if (!date || !time) {
      return res.status(400).json({ message: "Date and time are required" });
    }

    let remindAt = buildRemindAt(date, time);
    const now = new Date();

    if (remindAt <= now) {
      remindAt = new Date(now.getTime() + 2 * 60 * 1000);
    }

    const payload = {
      user: req.user._id,
      date,
      time,
      remindAt,
      message: message || "Time to start learning!",
    };
    if (courseId) payload.course = courseId;

    const reminder = await LearningReminder.create(payload);

    try {
      await notifyUser(req.user._id, req.user.email, {
        type: "reminder",
        title: "Learning reminder scheduled",
        message: `You will be reminded on ${date} at ${time}.`,
        link: `${clientUrl}/student/my-learning`,
      });
      await sendReminderEmail(req.user.email, {
        date,
        time,
        message: message || "Time to start learning!",
        courseTitle: "your learning session",
        link: `${clientUrl}/student/my-learning`,
      });
    } catch (notifyErr) {
      console.error("Reminder notification error:", notifyErr.message);
    }

    res.status(201).json({
      reminder: {
        id: reminder._id,
        date: reminder.date,
        time: reminder.time,
        message: reminder.message,
        remindAt: reminder.remindAt,
      },
      message: "Reminder set successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Could not set reminder" });
  }
};

const getMyReminders = async (req, res) => {
  try {
    const reminders = await LearningReminder.find({
      user: req.user._id,
      sent: false,
      remindAt: { $gte: new Date() },
    })
      .sort({ remindAt: 1 })
      .limit(20);

    res.json({ reminders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReminder, getMyReminders };
