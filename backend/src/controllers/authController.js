// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

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

module.exports = { register, login, logout, me };
