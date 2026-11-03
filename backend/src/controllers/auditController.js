// src/controllers/auditController.js
const { prisma } = require('../config/database');
const { enqueueAudit, getJobStatus } = require('../queues/auditQueue');
const logger = require('../config/logger');
const { createNotification } = require('../notifications/notificationService');

async function getAudits(req, res) {
  try {
    const { page = 1, limit = 20, websiteId, status, clientId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where = {};
    if (req.user.role === 'CLIENT') {
      where.website = { clientId: req.user.client?.id };
    } else if (clientId) {
      where.website = { clientId };
    }
    if (websiteId) where.websiteId = websiteId;
    if (status) where.status = status;

    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        include: {
          website: { select: { id: true, url: true, name: true, clientId: true } },
          result: { select: { overallScore: true, technicalScore: true, onPageScore: true, contentScore: true, cwvScore: true, schemaScore: true } },
          report: { select: { id: true, fileName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.audit.count({ where }),
    ]);

    res.json({ success: true, audits, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    logger.error('Get audits error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch audits' });
  }
}

async function createAudit(req, res) {
  try {
    const { websiteId } = req.body;
    if (!websiteId) return res.status(400).json({ success: false, message: 'websiteId required' });

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: { client: { include: { user: true } } },
    });
    if (!website) return res.status(404).json({ success: false, message: 'Website not found' });

    if (req.user.role === 'CLIENT' && website.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check for active/pending audit
    const activeAudit = await prisma.audit.findFirst({
      where: { websiteId, status: { in: ['WAITING', 'ACTIVE'] } },
    });
    if (activeAudit) {
      return res.status(409).json({ success: false, message: 'An audit is already running for this website' });
    }

    const audit = await prisma.audit.create({
      data: { websiteId, status: 'WAITING', triggeredBy: req.user.role === 'ADMIN' ? 'admin' : 'client' },
    });

    // Enqueue job
    await enqueueAudit(audit.id, {
      url: website.url,
      name: website.name,
      businessType: website.businessType,
      city: website.city,
      state: website.state,
      targetKeywords: website.targetKeywords,
      clientId: website.clientId,
      websiteId: website.id,
    });

    // Update jobId on audit
    await prisma.audit.update({ where: { id: audit.id }, data: { jobId: audit.id } });

    // Notify
    await createNotification({
      clientId: website.clientId,
      auditId: audit.id,
      type: 'AUDIT_STARTED',
      title: 'Audit Started',
      message: `SEO audit started for ${website.name}`,
    });

    logger.info('Audit created and enqueued', { auditId: audit.id, websiteId });
    res.status(201).json({ success: true, audit });
  } catch (error) {
    logger.error('Create audit error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to create audit' });
  }
}

async function getAudit(req, res) {
  try {
    const { id } = req.params;
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        website: { include: { client: { include: { user: { select: { name: true, email: true } } } } } },
        result: true,
        report: true,
      },
    });
    if (!audit) return res.status(404).json({ success: false, message: 'Audit not found' });

    if (req.user.role === 'CLIENT' && audit.website.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, audit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit' });
  }
}

async function getAuditStatus(req, res) {
  try {
    const { id } = req.params;
    const audit = await prisma.audit.findUnique({
      where: { id },
      select: { id: true, status: true, progress: true, jobId: true, errorMessage: true, websiteId: true, website: { select: { clientId: true } } },
    });
    if (!audit) return res.status(404).json({ success: false, message: 'Audit not found' });

    if (req.user.role === 'CLIENT' && audit.website.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let jobStatus = null;
    if (audit.jobId) {
      jobStatus = await getJobStatus(audit.jobId).catch(() => null);
    }

    res.json({ success: true, audit: { id: audit.id, status: audit.status, progress: audit.progress, errorMessage: audit.errorMessage }, jobStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get audit status' });
  }
}

async function retryAudit(req, res) {
  try {
    const { id } = req.params;
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const audit = await prisma.audit.findUnique({
      where: { id },
      include: { website: true },
    });
    if (!audit) return res.status(404).json({ success: false, message: 'Audit not found' });
    if (audit.status !== 'FAILED') {
      return res.status(400).json({ success: false, message: 'Only failed audits can be retried' });
    }

    await prisma.audit.update({ where: { id }, data: { status: 'WAITING', progress: 0, errorMessage: null, failedAt: null } });

    await enqueueAudit(audit.id, {
      url: audit.website.url,
      name: audit.website.name,
      businessType: audit.website.businessType,
      city: audit.website.city,
      state: audit.website.state,
      targetKeywords: audit.website.targetKeywords,
      clientId: audit.website.clientId,
      websiteId: audit.website.id,
    });

    logger.info('Audit retry enqueued', { auditId: id });
    res.json({ success: true, message: 'Audit retry enqueued' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retry audit' });
  }
}

async function getAdminStats(req, res) {
  try {
    const [totalClients, totalWebsites, auditStats, avgScore, recentAudits] = await Promise.all([
      prisma.client.count(),
      prisma.website.count(),
      prisma.audit.groupBy({ by: ['status'], _count: true }),
      prisma.auditResult.aggregate({ _avg: { overallScore: true } }),
      prisma.audit.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          website: { select: { name: true, url: true } },
          result: { select: { overallScore: true } },
        },
      }),
    ]);

    const stats = { WAITING: 0, ACTIVE: 0, COMPLETED: 0, FAILED: 0, DELAYED: 0 };
    auditStats.forEach(s => { stats[s.status] = s._count; });

    res.json({
      success: true,
      stats: {
        totalClients,
        totalWebsites,
        totalAudits: Object.values(stats).reduce((a, b) => a + b, 0),
        ...stats,
        averageSeoScore: Math.round(avgScore._avg.overallScore || 0),
      },
      recentAudits,
    });
  } catch (error) {
    logger.error('Admin stats error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
}

module.exports = { getAudits, createAudit, getAudit, getAuditStatus, retryAudit, getAdminStats };
