// src/controllers/websiteController.js
const { prisma } = require('../config/database');
const logger = require('../config/logger');

function validateUrl(url) {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname;
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(host)) return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host)) return false;
    return true;
  } catch { return false; }
}

async function getWebsites(req, res) {
  try {
    const { page = 1, limit = 20, clientId, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where = {};
    if (req.user.role === 'CLIENT') {
      where.clientId = req.user.client?.id;
    } else if (clientId) {
      where.clientId = clientId;
    }
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { url: { contains: search, mode: 'insensitive' } }];

    const [websites, total] = await Promise.all([
      prisma.website.findMany({
        where,
        include: {
          client: { include: { user: { select: { name: true, email: true } } } },
          _count: { select: { audits: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.website.count({ where }),
    ]);

    res.json({ success: true, websites, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    logger.error('Get websites error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch websites' });
  }
}

async function createWebsite(req, res) {
  try {
    const { url, name, businessType, city, state, targetKeywords, clientId } = req.body;
    if (!url || !name) return res.status(400).json({ success: false, message: 'url and name required' });
    if (!validateUrl(url)) return res.status(400).json({ success: false, message: 'Invalid or unsafe URL' });

    let assignedClientId = clientId;
    if (req.user.role === 'CLIENT') {
      assignedClientId = req.user.client?.id;
    }
    if (!assignedClientId) return res.status(400).json({ success: false, message: 'clientId required' });

    if (req.user.role === 'CLIENT' && assignedClientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Cannot create website for another client' });
    }

    const website = await prisma.website.create({
      data: {
        url: url.toLowerCase().trim(),
        name,
        businessType: businessType || 'general',
        city,
        state,
        targetKeywords: targetKeywords || [],
        clientId: assignedClientId,
      },
      include: { client: { include: { user: { select: { name: true } } } } },
    });

    logger.info('Website created', { websiteId: website.id });
    res.status(201).json({ success: true, website });
  } catch (error) {
    logger.error('Create website error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to create website' });
  }
}

async function getWebsite(req, res) {
  try {
    const { id } = req.params;
    const website = await prisma.website.findUnique({
      where: { id },
      include: {
        client: { include: { user: { select: { id: true, name: true, email: true } } } },
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { result: { select: { overallScore: true } } },
        },
      },
    });
    if (!website) return res.status(404).json({ success: false, message: 'Website not found' });

    if (req.user.role === 'CLIENT' && website.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, website });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch website' });
  }
}

async function updateWebsite(req, res) {
  try {
    const { id } = req.params;
    const website = await prisma.website.findUnique({ where: { id } });
    if (!website) return res.status(404).json({ success: false, message: 'Website not found' });

    if (req.user.role === 'CLIENT' && website.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { url, name, businessType, city, state, targetKeywords, isActive } = req.body;
    if (url && !validateUrl(url)) return res.status(400).json({ success: false, message: 'Invalid or unsafe URL' });

    const updated = await prisma.website.update({
      where: { id },
      data: {
        ...(url && { url }),
        ...(name && { name }),
        ...(businessType && { businessType }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(targetKeywords && { targetKeywords }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, website: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update website' });
  }
}

async function deleteWebsite(req, res) {
  try {
    const { id } = req.params;
    const website = await prisma.website.findUnique({ where: { id } });
    if (!website) return res.status(404).json({ success: false, message: 'Website not found' });

    if (req.user.role === 'CLIENT' && website.clientId !== req.user.client?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await prisma.website.delete({ where: { id } });
    res.json({ success: true, message: 'Website deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete website' });
  }
}

module.exports = { getWebsites, createWebsite, getWebsite, updateWebsite, deleteWebsite };
