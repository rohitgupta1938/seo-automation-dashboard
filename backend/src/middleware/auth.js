// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { client: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function requireClient(req, res, next) {
  if (req.user?.role !== 'CLIENT' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireClient };
