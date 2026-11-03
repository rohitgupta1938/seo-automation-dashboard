// src/controllers/authController.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const { sendPasswordResetEmail } = require('../notifications/emailService');

function generateToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res) {
  try {
    const { email, password, name, role = 'CLIENT', companyName, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const validRole = ['ADMIN', 'CLIENT'].includes(role.toUpperCase()) ? role.toUpperCase() : 'CLIENT';
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: validRole,
        ...(validRole === 'CLIENT' && {
          client: {
            create: {
              companyName: companyName || name,
              phone: phone || null,
            },
          },
        }),
      },
      include: { client: true },
    });

    const token = generateToken(user.id);
    logger.info('User registered', { userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, client: user.client },
    });
  } catch (error) {
    logger.error('Register error', { error: error.message });
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { client: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    logger.info('User logged in', { userId: user.id, role: user.role });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, client: user.client },
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully' });
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { client: true },
      select: {
        id: true, email: true, name: true, role: true, createdAt: true,
        client: { select: { id: true, companyName: true, phone: true } },
      },
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return success to avoid email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // Generate token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send reset email
    sendPasswordResetEmail({
      recipientEmail: user.email,
      clientName: user.name,
      resetUrl,
    }).catch(err => {
      logger.error('Failed to send reset email', { error: err.message, userId: user.id });
    });

    logger.info('Password reset requested', { userId: user.id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
      ...(!process.env.EMAIL_USER && {
        resetUrl,
        devNote: 'Real SMTP is not configured in backend/.env. Use the provided link to test password reset directly.',
      }),
    });
  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    logger.info('Password reset successful', { userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}

module.exports = { register, login, logout, me, forgotPassword, resetPassword };
