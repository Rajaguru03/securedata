const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  // In development without Gmail credentials — log to console instead
  if (!gmailUser || !gmailPass || gmailUser === 'your-gmail@gmail.com') {
    const linkMatch = html.match(/href="([^"]+reset-password[^"]+)"/);
    console.log('\n📧 [DEV] Password reset email (not sent — no Gmail config)');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (linkMatch) console.log(`Reset URL: ${linkMatch[1]}`);
    console.log('');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"SecureCard" <${gmailUser}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
