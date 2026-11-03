// src/notifications/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.warn('EMAIL_USER and/or EMAIL_PASSWORD not set in .env — email simulated in console logs');
    return null;
  }

  if (process.env.EMAIL_HOST === 'smtp.gmail.com' || (process.env.EMAIL_USER && process.env.EMAIL_USER.endsWith('@gmail.com'))) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
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

async function sendWelcomeEmail({ recipientEmail, clientName, temporaryPassword, companyName, phone, loginUrl }) {
  try {
    const transporter = createTransporter();
    const portalUrl = loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    if (!transporter) {
      logger.info('[DEV EMAIL] Welcome email simulated', {
        to: recipientEmail,
        clientName,
        companyName,
        phone,
        temporaryPassword,
        loginUrl: portalUrl,
      });
      return { status: 'simulated', messageId: `dev-welcome-${Date.now()}` };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SEO Dashboard" <noreply@seodashboard.com>',
      to: recipientEmail,
      subject: `Welcome to SEO Automation Dashboard — Your Account Credentials`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;line-height:1.6;">
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px;border-radius:12px 12px 0 0;color:#ffffff;">
            <h2 style="margin:0;font-size:22px;font-weight:700;">Welcome to SEO Dashboard</h2>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Your Client Portal account is ready</p>
          </div>
          <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <p>Hi <strong>${clientName}</strong>,</p>
            <p>An administrator has registered your account on the <strong>SEO Automation Dashboard</strong>.</p>
            
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="margin:0 0 12px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Your Login Credentials</h3>
              <p style="margin:4px 0;"><strong>Email:</strong> <span style="color:#0ea5e9;">${recipientEmail}</span></p>
              <p style="margin:4px 0;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:3px 8px;border-radius:4px;font-weight:700;color:#0f172a;">${temporaryPassword}</code></p>
              ${companyName ? `<p style="margin:4px 0;"><strong>Company:</strong> ${companyName}</p>` : ''}
              ${phone ? `<p style="margin:4px 0;"><strong>Phone / Mobile:</strong> ${phone}</p>` : ''}
            </div>

            <p style="margin:20px 0;">
              <a href="${portalUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:14px;">Log In to Client Portal</a>
            </p>

            <p style="font-size:12px;color:#64748b;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">
              For security, we recommend updating your password after logging in. If you ever forget your password, use the "Forgot Password" option on the sign-in page.
            </p>
          </div>
        </div>`,
    });

    logger.info('Welcome email sent', { messageId: info.messageId, to: recipientEmail });
    return { status: 'sent', messageId: info.messageId };
  } catch (error) {
    logger.error('Welcome email send failed', { error: error.message });
    return { status: 'failed', error: error.message };
  }
}

async function sendPasswordResetEmail({ recipientEmail, clientName, resetUrl }) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.info('[DEV EMAIL] Password reset email simulated', {
        to: recipientEmail,
        clientName,
        resetUrl,
      });
      return { status: 'simulated', messageId: `dev-reset-${Date.now()}` };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SEO Dashboard" <noreply@seodashboard.com>',
      to: recipientEmail,
      subject: `Reset Your Password — SEO Dashboard`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;line-height:1.6;">
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px;border-radius:12px 12px 0 0;color:#ffffff;">
            <h2 style="margin:0;font-size:22px;font-weight:700;">Password Reset Request</h2>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">SEO Automation Dashboard</p>
          </div>
          <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <p>Hi <strong>${clientName || 'there'}</strong>,</p>
            <p>We received a request to reset your password for your SEO Dashboard account. Click the button below to choose a new password:</p>

            <p style="margin:24px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:14px;">Reset Password</a>
            </p>

            <p style="font-size:13px;color:#64748b;">Or copy and paste this link into your browser:</p>
            <p style="font-size:12px;color:#0ea5e9;word-break:break-all;"><a href="${resetUrl}" style="color:#0ea5e9;">${resetUrl}</a></p>

            <p style="font-size:12px;color:#94a3b8;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">
              This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>`,
    });

    logger.info('Password reset email sent', { messageId: info.messageId, to: recipientEmail });
    return { status: 'sent', messageId: info.messageId };
  } catch (error) {
    logger.error('Password reset email failed', { error: error.message });
    return { status: 'failed', error: error.message };
  }
}

module.exports = { sendReportEmail, sendWelcomeEmail, sendPasswordResetEmail };
