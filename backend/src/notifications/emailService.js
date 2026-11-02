// src/notifications/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    logger.warn('Email not configured — using ethereal test account simulation');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });
}

async function sendReportEmail(recipientEmail, clientName, websiteName, overallScore, reportPath) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.info('[DEV EMAIL] Report email simulated', { to: recipientEmail, websiteName, overallScore });
      return { status: 'simulated', messageId: `dev-${Date.now()}` };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SEO Dashboard" <noreply@seodashboard.com>',
      to: recipientEmail,
      subject: `SEO Audit Report — ${websiteName} (Score: ${overallScore}/100)`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f172a">SEO Audit Complete</h2>
          <p>Hi ${clientName},</p>
          <p>Your SEO audit for <strong>${websiteName}</strong> is ready.</p>
          <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
            <div style="font-size:48px;font-weight:800;color:${overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}">${overallScore}</div>
            <div style="color:#64748b">Overall SEO Score / 100</div>
          </div>
          <p>Your full PDF report is attached to this email.</p>
          <p>— Edgelink SEO Dashboard Team</p>
        </div>`,
      attachments: reportPath ? [{ filename: `seo-report-${websiteName}.pdf`, path: reportPath }] : [],
    });

    logger.info('Report email sent', { messageId: info.messageId, to: recipientEmail });
    return { status: 'sent', messageId: info.messageId };
  } catch (error) {
    logger.error('Email send failed', { error: error.message });
    return { status: 'failed', error: error.message };
  }
}

module.exports = { sendReportEmail };
