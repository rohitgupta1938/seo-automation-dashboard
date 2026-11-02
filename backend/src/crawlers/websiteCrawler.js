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
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SEO-Dashboard-Crawler/1.0 (audit bot)', 'Accept': 'text/html,application/xhtml+xml' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status, html: await res.text(), url: res.url, finalUrl: res.url };
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

function extractPageData(html, pageUrl) {
  const $ = cheerio.load(html);
  const baseUrl = new URL(pageUrl);

  const title = $('title').first().text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const metaRobots = $('meta[name="robots"]').attr('content') || '';
  const lang = $('html').attr('lang') || '';

  const h1s = [];
  $('h1').each((_, el) => h1s.push($(el).text().trim()));
  const h2s = [];
  $('h2').each((_, el) => h2s.push($(el).text().trim()));

  const images = [];
  const imagesWithMissingAlt = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt');
    images.push({ src, alt: alt || '' });
    if (!alt || alt.trim() === '') imagesWithMissingAlt.push(src);
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

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
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
    h1s,
    h2s,
    images,
    imagesWithMissingAlt,
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)],
    wordCount,
    jsonLdBlocks,
    isNoIndex,
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
      const { html, status, finalUrl } = await fetchPage(url);
      httpStatus = status;
      if (finalUrl !== url) redirectDetected = true;

      const pageData = extractPageData(html, finalUrl);
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

  const [robotsTxt, sitemapXml] = await Promise.all([
    checkRobotsTxt(targetUrl),
    checkSitemapXml(targetUrl),
  ]);

  // Duplicate analysis
  const titles = pages.map(p => p.title).filter(Boolean);
  const duplicateTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  const descriptions = pages.map(p => p.metaDescription).filter(Boolean);
  const duplicateDescriptions = descriptions.filter((d, i) => descriptions.indexOf(d) !== i);

  logger.info('Crawl complete', { url: targetUrl, pagesFound: pages.length });

  return {
    mainPage: mainPageData,
    pages,
    totalPagesCrawled: pages.length,
    httpStatus,
    isHttps,
    redirectDetected,
    robotsTxt,
    sitemapXml,
    duplicateTitles,
    duplicateDescriptions,
  };
}

module.exports = { crawlWebsite };
