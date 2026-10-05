const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT || 587,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD
    }
  });
}

/**
 * Send an email notification or OTP
 * @returns {Promise<boolean>} whether email was dispatched
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.warn(`[Email Service] SMTP not configured. Skipped sending email to: ${to} (Subject: ${subject})`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || env.EMAIL_USER,
      to,
      subject,
      text,
      html
    });
    console.log(`[Email Service] Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  isEmailConfigured: () => Boolean(transporter)
};
