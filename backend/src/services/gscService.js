// src/services/gscService.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/gsc.mock');
const logger = require('../config/logger');

async function getGSCData(siteUrl) {
  if (USE_MOCKS) {
    logger.info('[MOCK] GSC data returned', { siteUrl });
    return { ...mockData };
  }

  // Real integration placeholder
  throw new Error('Real GSC integration not configured. Set USE_MOCKS=true or provide GSC credentials.');
}

module.exports = { getGSCData };
