const axios = require('axios');

const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;

  // In development without Brevo key — log reset URL to console
  if (!apiKey || apiKey === 'your-brevo-api-key') {
    const linkMatch = html.match(/href="([^"]+reset-password[^"]+)"/);
    console.log('\n[DEV] Password reset email (not sent — no Brevo API key)');
    console.log(`To: ${to}`);
    if (linkMatch) console.log(`Reset URL: ${linkMatch[1]}`);
    console.log('');
    return;
  }

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'SecureCard', email: process.env.BREVO_SENDER_EMAIL || to },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('Brevo error:', err.response?.data || err.message);
    throw err;
  }
};

module.exports = sendEmail;
