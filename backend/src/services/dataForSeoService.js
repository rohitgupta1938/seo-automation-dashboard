// src/services/dataForSeoService.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/dataforseo.mock');
const logger = require('../config/logger');

async function getKeywordRankings(domain, keyword) {
  if (USE_MOCKS) {
    logger.info('[MOCK] DataForSEO rankings returned', { domain, keyword });
    return { ...mockData };
  }

  // Real integration placeholder
  throw new Error('Real DataForSEO integration not configured. Set USE_MOCKS=true or provide DataForSEO credentials.');
}

module.exports = { getKeywordRankings };
