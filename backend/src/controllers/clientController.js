// src/controllers/clientController.js
const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

async function getClients(req, res) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? { OR: [{ user: { name: { contains: search, mode: 'insensitive' } } }, { companyName: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, createdAt: true } },
          websites: { select: { id: true, url: true, name: true } },
          _count: { select: { websites: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.client.count({ where }),
    ]);

    res.json({ success: true, clients, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    logger.error('Get clients error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch clients' });
  }
}

async function createClient(req, res) {
  try {
    const { email, password, name, companyName, phone, address } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'email, password, name required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const client = await prisma.client.create({
      data: {
        companyName: companyName || name,
        phone,
        address,
        user: {
          create: { email, password: hashed, name, role: 'CLIENT' },
        },
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    logger.info('Client created by admin', { clientId: client.id, adminId: req.user.id });
    res.status(201).json({ success: true, client });
  } catch (error) {
    logger.error('Create client error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to create client' });
  }
}

async function getClient(req, res) {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true } },
        websites: { include: { _count: { select: { audits: true } } } },
      },
    });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch client' });
  }
}

async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const { companyName, phone, address, name, email } = req.body;

    const client = await prisma.client.findUnique({ where: { id }, include: { user: true } });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(companyName && { companyName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(name || email
          ? {
              user: {
                update: {
                  ...(name && { name }),
                  ...(email && { email }),
                },
              },
            }
          : {}),
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    res.json({ success: true, client: updated });
  } catch (error) {
    logger.error('Update client error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update client' });
  }
}

async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    await prisma.user.delete({ where: { id: client.userId } });
    logger.info('Client deleted', { clientId: id, adminId: req.user.id });
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    logger.error('Delete client error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete client' });
  }
}

module.exports = { getClients, createClient, getClient, updateClient, deleteClient };
