import nodemailer from "nodemailer";

// The email login comes only from env vars. Never put real credentials in code.
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const emailConfigured = Boolean(EMAIL_USER && EMAIL_PASS);

if (!emailConfigured) {
  // Name the missing variables only. Never log their values.
  console.warn("[email] EMAIL_USER or EMAIL_PASS is not set. Password reset and invite emails will not be sent.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// The sender shown in the "From" field: the same account that sends the mail.
const FROM_ADDRESS = `"Corely Enterprise" <${EMAIL_USER ?? ""}>`;

// Returned when email is not set up, so callers can tell the user it did not go out.
function notConfigured() {
  return { success: false, error: new Error("Email is not configured: EMAIL_USER and EMAIL_PASS are missing") };
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  if (!emailConfigured) return notConfigured();

  const mailOptions = {
    from: FROM_ADDRESS,
    to,
    subject: "Reset your Corely password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password for your Corely Enterprise account.</p>
        <p>Click the button below to choose a new password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #ff6b00; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
        <p style="color: #71717a; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px;">Corely Enterprise AI</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!emailConfigured) return notConfigured();

  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending generic email:", error);
    return { success: false, error };
  }
}
