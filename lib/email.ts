import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "krishilagrawal026@gmail.com",
    pass: process.env.EMAIL_PASS || "jziz jwds swjg usty",
  },
});

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const mailOptions = {
    from: '"Corely Enterprise" <no-reply@corely.ai>',
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
  try {
    await transporter.sendMail({
      from: '"Corely Enterprise" <no-reply@corely.ai>',
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
