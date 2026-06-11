const Notification = require("../models/Notification");
const { sendNotificationEmail } = require("./email");

const notifyUser = async (userId, email, { type, title, message, link = "" }) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link,
  });

  let recipientEmail = email;
  if (!recipientEmail) {
    const User = require("../models/User");
    const user = await User.findById(userId).select("email");
    recipientEmail = user?.email;
  }
  if (recipientEmail) {
    await sendNotificationEmail(recipientEmail, title, message, link);
  }

  return notification;
};

const notifyAdmins = async (title, message, link = "") => {
  const User = require("../models/User");
  const admins = await User.find({ role: "admin" });
  await Promise.all(
    admins.map((admin) =>
      notifyUser(admin._id, admin.email, { type: "system", title, message, link })
    )
  );
};

module.exports = { notifyUser, notifyAdmins };
