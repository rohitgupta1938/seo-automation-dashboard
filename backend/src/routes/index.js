// src/routes/index.js
const express = require('express');
const router = express.Router();

const { authenticate, requireAdmin } = require('../middleware/auth');
const { register, login, logout, me, forgotPassword, resetPassword } = require('../controllers/authController');
const { getClients, createClient, getClient, updateClient, deleteClient } = require('../controllers/clientController');
const { getWebsites, createWebsite, getWebsite, updateWebsite, deleteWebsite } = require('../controllers/websiteController');
const { getAudits, createAudit, getAudit, getAuditStatus, retryAudit, getAdminStats } = require('../controllers/auditController');
const { getNotifications, markAsRead } = require('../notifications/notificationService');
const { prisma } = require('../config/database');
const { enqueueAudit } = require('../queues/auditQueue');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');

// Health
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', authenticate, logout);
router.get('/auth/me', authenticate, me);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Admin Stats
router.get('/admin/stats', authenticate, requireAdmin, getAdminStats);

// Clients (Admin only)
router.get('/clients', authenticate, requireAdmin, getClients);
router.post('/clients', authenticate, requireAdmin, createClient);
router.get('/clients/:id', authenticate, requireAdmin, getClient);
router.patch('/clients/:id', authenticate, requireAdmin, updateClient);
router.delete('/clients/:id', authenticate, requireAdmin, deleteClient);

// Websites
router.get('/websites', authenticate, getWebsites);
router.post('/websites', authenticate, createWebsite);
router.get('/websites/:id', authenticate, getWebsite);
router.patch('/websites/:id', authenticate, updateWebsite);
router.delete('/websites/:id', authenticate, deleteWebsite);

// Audits
router.get('/audits', authenticate, getAudits);
router.post('/audits', authenticate, createAudit);
router.get('/audits/:id', authenticate, getAudit);
router.get('/audits/:id/status', authenticate, getAuditStatus);
router.post('/audits/:id/retry', authenticate, requireAdmin, retryAudit);

// Reports
router.get('/reports', authenticate, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'CLIENT') {
      where = { audit: { website: { clientId: req.user.client?.id } } };
    }
    const reports = await prisma.report.findMany({
      where,
      include: {
        audit: { include: { website: { select: { name: true, url: true } } } },
        deliveries: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
    res.json({ success: true, reports });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

router.get('/reports/:id', authenticate, async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: { audit: { include: { website: true } }, deliveries: true },
    });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (req.user.role === 'CLIENT' && report.audit.website.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, report });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
});

router.get('/reports/:id/download', authenticate, async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: { audit: { include: { website: true } } },
    });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (req.user.role === 'CLIENT' && report.audit.website.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found on disk' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    fs.createReadStream(report.filePath).pipe(res);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to download report' });
  }
});

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markAsRead);

// Cron — Monthly audits
router.post('/cron/monthly-audits', async (req, res) => {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const websites = await prisma.website.findMany({
      where: {
        isActive: true,
        OR: [{ lastAuditAt: null }, { lastAuditAt: { lt: thirtyDaysAgo } }],
      },
    });

    const enqueued = [];
    for (const website of websites) {
      // Check no active audit
      const active = await prisma.audit.findFirst({
        where: { websiteId: website.id, status: { in: ['WAITING', 'ACTIVE'] } },
      });
      if (active) continue;

      const audit = await prisma.audit.create({
        data: { websiteId: website.id, status: 'WAITING', triggeredBy: 'cron' },
      });
      await enqueueAudit(audit.id, {
        url: website.url, name: website.name, businessType: website.businessType,
        city: website.city, state: website.state, targetKeywords: website.targetKeywords,
        clientId: website.clientId, websiteId: website.id,
      });
      await prisma.audit.update({ where: { id: audit.id }, data: { jobId: audit.id } });
      enqueued.push({ websiteId: website.id, auditId: audit.id });
    }

    logger.info('Monthly cron audits enqueued', { count: enqueued.length });
    res.json({ success: true, message: `Enqueued ${enqueued.length} monthly audits`, enqueued });
  } catch (error) {
    logger.error('Cron error', { error: error.message });
    res.status(500).json({ success: false, message: 'Cron failed' });
  }
});

module.exports = router;
