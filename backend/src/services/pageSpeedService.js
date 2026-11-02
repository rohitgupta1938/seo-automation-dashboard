// src/services/pageSpeedService.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/pagespeed.mock');
const logger = require('../config/logger');

async function getPageSpeedData(url, strategy = 'mobile') {
  if (USE_MOCKS) {
    logger.info('[MOCK] PageSpeed data returned', { url });
    return { ...mockData, url, strategy };
  }

  // Real integration (requires PAGESPEED_API_KEY)
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) throw new Error('PAGESPEED_API_KEY not configured and USE_MOCKS=false');

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`PageSpeed API error: ${res.status}`);
  return res.json();
}

module.exports = { getPageSpeedData };
