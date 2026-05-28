import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // Assuming gmail given the email domain
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not found. Falling back to console logging.");
    console.log(`[MOCK EMAIL] To: ${to}\nSubject: ${subject}\nBody: ${html}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Corely Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
