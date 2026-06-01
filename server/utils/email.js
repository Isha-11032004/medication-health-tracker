import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send email if SMTP is configured; otherwise log only
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email skipped] To: ${to} | ${subject}`);
    return { skipped: true };
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, ''),
  });
  return { sent: true };
};
