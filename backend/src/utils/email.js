const nodemailer = require("nodemailer");

const getTransporter = () => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return null;
  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
};

const sendMail = async (to, subject, html) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[DEV EMAIL] To: ${to} | ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html,
  });
};

const sendOtpEmail = async (email, otp) => {
  await sendMail(
    email,
    "LISHA Academy Password Reset OTP",
    `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#2f7d32;">Password Reset Request</h2>
      <p>Your OTP is:</p>
      <div style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#1f2937;margin:16px 0;">${otp}</div>
      <p>Valid for 10 minutes.</p>
    </div>`
  );
};

const sendNotificationEmail = async (email, title, message, link = "") => {
  try {
    const linkHtml = link
      ? `<p><a href="${link}" style="color:#2e7d32;font-weight:bold;">View details →</a></p>`
      : "";
    await sendMail(
      email,
      `LISHA Academy — ${title}`,
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#2e7d32;">${title}</h2>
        <p>${message}</p>
        ${linkHtml}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#6b7280;">LISHA Academy e-learning platform</p>
      </div>`
    );
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send notification email to ${email}:`, error.message);
  }
};

const sendReminderEmail = async (email, { date, time, message, courseTitle, link }) => {
  try {
    await sendMail(
      email,
      "LISHA Academy — Learning Reminder",
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#2e7d32;">Time to learn!</h2>
        <p><strong>Date:</strong> ${date} at ${time}</p>
        <p><strong>Course:</strong> ${courseTitle}</p>
        <p>${message}</p>
        <p><a href="${link}" style="color:#2e7d32;font-weight:bold;">Open My Learning →</a></p>
      </div>`
    );
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send reminder email to ${email}:`, error.message);
  }
};

const sendPasswordChangeOtpEmail = async (email, otp) => {
  await sendMail(
    email,
    "LISHA Academy — Password Change OTP",
    `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#2f7d32;">Verify Password Change</h2>
      <p>Your OTP to change your password is:</p>
      <div style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#1f2937;margin:16px 0;">${otp}</div>
      <p>Valid for 10 minutes. If you did not request this, ignore this email.</p>
    </div>`
  );
};

const sendSecurityAlertEmail = async (email, action, details = {}) => {
  try {
    const time = new Date().toLocaleString();
    const ip = details.ip ? `<p><strong>IP:</strong> ${details.ip}</p>` : "";
    await sendMail(
      email,
      `LISHA Academy — Security alert: ${action}`,
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#2e7d32;">Account activity notice</h2>
        <p><strong>Action:</strong> ${action}</p>
        <p><strong>Time:</strong> ${time}</p>
        ${ip}
        <p>If this wasn't you, please reset your password immediately and contact support.</p>
      </div>`
    );
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send security alert email to ${email}:`, error.message);
  }
};

module.exports = {
  sendOtpEmail,
  sendNotificationEmail,
  sendReminderEmail,
  sendPasswordChangeOtpEmail,
  sendSecurityAlertEmail,
  sendMail,
};
