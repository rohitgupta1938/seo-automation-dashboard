// src/notifications/notificationService.js
const { prisma } = require('../config/database');
const logger = require('../config/logger');

async function createNotification({ userId, clientId, auditId, type, title, message, metadata }) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, clientId, auditId, type, title, message, metadata },
    });
    return notification;
  } catch (error) {
    logger.error('Failed to create notification', { error: error.message });
    return null;
  }
}

async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where = {};
    if (req.user.role === 'CLIENT') {
      where.clientId = req.user.client?.id;
    }
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: { audit: { select: { id: true, website: { select: { name: true } } } } },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({ success: true, notifications, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

    if (req.user.role === 'CLIENT' && notification.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
}

module.exports = { createNotification, getNotifications, markAsRead };
