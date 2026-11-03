// src/crawlers/websiteCrawler.js
const cheerio = require('cheerio');
const logger = require('../config/logger');

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
const PRIVATE_IP_REGEX = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;
const CRAWL_TIMEOUT = 10000;
const MAX_PAGES = 5;

function isSafeUrl(url) {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    if (BLOCKED_HOSTS.includes(u.hostname)) return false;
    if (PRIVATE_IP_REGEX.test(u.hostname)) return false;
    return true;
  } catch { return false; }
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CRAWL_TIMEOUT);
  const startTime = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (SEO-Dashboard-AuditBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    const responseTime = Date.now() - startTime;
    clearTimeout(timer);
    return { ok: res.ok, status: res.status, html: await res.text(), url: res.url, finalUrl: res.url, responseTime };
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

function extractPageData(html, pageUrl, responseTime = 0) {
  const $ = cheerio.load(html);
  const baseUrl = new URL(pageUrl);

  const title = $('title').first().text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const metaRobots = $('meta[name="robots"]').attr('content') || '';
  const lang = $('html').attr('lang') || '';
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || '';

  // Open Graph metadata
  const openGraph = {
    title: $('meta[property="og:title"]').attr('content') || $('meta[name="og:title"]').attr('content') || '',
    description: $('meta[property="og:description"]').attr('content') || $('meta[name="og:description"]').attr('content') || '',
    image: $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content') || '',
    type: $('meta[property="og:type"]').attr('content') || $('meta[name="og:type"]').attr('content') || '',
  };

  // Full Headings extraction (H1–H6)
  const headings = {
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: []
  };
  $('h1').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h1.push(t); });
  $('h2').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h2.push(t); });
  $('h3').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h3.push(t); });
  $('h4').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h4.push(t); });
  $('h5').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h5.push(t); });
  $('h6').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h6.push(t); });

  const h1s = headings.h1;
  const h2s = headings.h2;

  // Images & Alt attributes
  const images = [];
  const imagesWithMissingAlt = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt');
    images.push({ src, alt: alt || '' });
    if (alt === undefined || alt === null || alt.trim() === '') {
      imagesWithMissingAlt.push(src || '(empty-src)');
    }
  });

  const internalLinks = [];
  const externalLinks = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === baseUrl.hostname) {
        internalLinks.push(resolved.href);
      } else if (['http:', 'https:'].includes(resolved.protocol)) {
        externalLinks.push(resolved.href);
      }
    } catch {}
  });

  // Remove scripts, styles, noscript, svg from body text calculation for authentic readability
  const bodyClone = $('body').clone();
  bodyClone.find('script, style, noscript, svg').remove();
  const bodyText = bodyClone.text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter(w => w.length > 0).length;

  // JSON-LD extraction
  const jsonLdBlocks = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html());
      jsonLdBlocks.push(parsed);
    } catch { jsonLdBlocks.push({ _error: 'invalid JSON-LD' }); }
  });

  const isNoIndex = /noindex/i.test(metaRobots);

  return {
    url: pageUrl,
    title,
    metaDescription,
    canonical,
    metaRobots,
    lang,
    viewport,
    charset,
    openGraph,
    headings,
    h1s,
    h2s,
    images,
    imagesWithMissingAlt,
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)],
    wordCount,
    jsonLdBlocks,
    isNoIndex,
    responseTime,
  };
}

async function checkRobotsTxt(baseUrl) {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    const res = await fetch(robotsUrl, { headers: { 'User-Agent': 'SEO-Dashboard-Crawler/1.0' } });
    if (res.ok) {
      const text = await res.text();
      return { exists: true, content: text.slice(0, 2000), hasSitemapDirective: /sitemap:/i.test(text) };
    }
    return { exists: false };
  } catch { return { exists: false, error: 'Fetch failed' }; }
}

async function checkSitemapXml(baseUrl) {
  try {
    const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
    const res = await fetch(sitemapUrl, { headers: { 'User-Agent': 'SEO-Dashboard-Crawler/1.0' } });
    if (res.ok) {
      const text = await res.text();
      const urlCount = (text.match(/<url>/gi) || []).length;
      return { exists: true, urlCount };
    }
    return { exists: false };
  } catch { return { exists: false, error: 'Fetch failed' }; }
}

async function crawlWebsite(targetUrl) {
  if (!isSafeUrl(targetUrl)) {
    throw new Error(`Unsafe URL blocked: ${targetUrl}`);
  }

  logger.info('Starting website crawl', { url: targetUrl });
  const baseUrl = new URL(targetUrl);
  const visited = new Set();
  const queue = [targetUrl];
  const pages = [];
  let mainPageData = null;
  let httpStatus = null;
  let isHttps = baseUrl.protocol === 'https:';
  let redirectDetected = false;

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const { html, status, finalUrl, responseTime } = await fetchPage(url);
      httpStatus = status;
      if (finalUrl !== url) redirectDetected = true;

      const pageData = extractPageData(html, finalUrl, responseTime);
      pages.push(pageData);
      if (pages.length === 1) mainPageData = pageData;

      // Discover more pages (same domain only)
      for (const link of pageData.internalLinks.slice(0, 10)) {
        if (!visited.has(link) && pages.length + queue.length < MAX_PAGES) {
          queue.push(link);
        }
      }
    } catch (error) {
      logger.warn('Page crawl failed', { url, error: error.message });
      if (pages.length === 0) {
        httpStatus = error.message.includes('abort') ? 408 : 0;
        mainPageData = { url, error: error.message };
      }
    }
  }

  // Gracefully handle crawl failures
  if (pages.length === 0) {
    const errorMsg = mainPageData?.error || (httpStatus ? `HTTP ${httpStatus}` : 'Connection timed out or host unreachable');
    logger.error('Target website crawl failed completely', { url: targetUrl, error: errorMsg });
    throw new Error(`Unable to crawl target website (${targetUrl}): ${errorMsg}`);
  }

  const [robotsTxt, sitemapXml] = await Promise.all([
    checkRobotsTxt(targetUrl),
    checkSitemapXml(targetUrl),
  ]);

  // Duplicate analysis
  const titles = pages.map(p => p.title).filter(Boolean);
  const duplicateTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  const descriptions = pages.map(p => p.metaDescription).filter(Boolean);
  const duplicateDescriptions = descriptions.filter((d, i) => descriptions.indexOf(d) !== i);

  const avgResponseTime = pages.length > 0 ? Math.round(pages.reduce((acc, p) => acc + (p.responseTime || 0), 0) / pages.length) : 0;

  logger.info('Crawl complete', { url: targetUrl, pagesFound: pages.length, avgResponseTime });

  return {
    mainPage: mainPageData,
    pages,
    totalPagesCrawled: pages.length,
    httpStatus,
    isHttps,
    redirectDetected,
    responseTime: avgResponseTime,
    robotsTxt,
    sitemapXml,
    duplicateTitles,
    duplicateDescriptions,
  };
}

module.exports = { crawlWebsite };
