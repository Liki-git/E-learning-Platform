const LearningReminder = require("../models/LearningReminder");
const User = require("../models/User");
const Course = require("../models/Course");
const { notifyUser } = require("./notify");
const { sendReminderEmail } = require("./email");

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const processDueReminders = async () => {
  try {
    const due = await LearningReminder.find({
      remindAt: { $lte: new Date() },
      sent: false,
    }).limit(50);

    for (const reminder of due) {
      try {
        const user = await User.findById(reminder.user);
        if (!user) {
          reminder.sent = true;
          await reminder.save();
          continue;
        }

        let courseTitle = "your course";
        if (reminder.course) {
          const course = await Course.findById(reminder.course);
          if (course) courseTitle = course.title;
        }

        const title = "Learning reminder";
        const message = reminder.message || `Time to learn: ${courseTitle}`;

        // Send in-app notification
        try {
          await notifyUser(user._id, user.email, {
            type: "reminder",
            title,
            message,
            link: `${clientUrl}/student/my-learning`,
          });
        } catch (notifyErr) {
          console.error(`In-app notification failed for user ${user._id}:`, notifyErr.message);
        }

        // Send email notification
        try {
          await sendReminderEmail(user.email, {
            date: reminder.date,
            time: reminder.time,
            message,
            courseTitle,
            link: `${clientUrl}/student/my-learning`,
          });
        } catch (emailErr) {
          console.error(`Email notification failed for user ${user._id}:`, emailErr.message);
        }

        reminder.sent = true;
        await reminder.save();
      } catch (reminderErr) {
        console.error(`Failed to process reminder ${reminder._id}:`, reminderErr.message);
        try {
          reminder.sent = true;
          await reminder.save();
        } catch (saveErr) {
          console.error(`Failed to force mark reminder ${reminder._id} as sent:`, saveErr.message);
        }
      }
    }
  } catch (error) {
    console.error("Reminder scheduler error:", error.message);
  }
};

const startReminderScheduler = () => {
  processDueReminders();
  setInterval(processDueReminders, 60 * 1000);
};

module.exports = { startReminderScheduler, processDueReminders };
