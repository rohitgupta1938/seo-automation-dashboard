// src/services/technicalSeoAnalyzer.js

function analyzeTechnical(crawlData) {
  const { httpStatus, isHttps, redirectDetected, responseTime = 0, robotsTxt = {}, sitemapXml = {}, mainPage } = crawlData;
  const issues = [];
  const warnings = [];

  // HTTPS Protocol
  if (!isHttps) {
    issues.push('Website is not served over secure HTTPS protocol');
  }

  // HTTP Status Code
  if (httpStatus === 0) {
    issues.push('Website server unreachable or connection timed out');
  } else if (httpStatus >= 500) {
    issues.push(`Server returned 5xx internal server error (HTTP ${httpStatus})`);
  } else if (httpStatus >= 400) {
    issues.push(`Target page returned 4xx client error (HTTP ${httpStatus})`);
  } else if (httpStatus >= 300) {
    warnings.push(`Initial URL redirects with HTTP ${httpStatus}`);
  }

  // Redirect chain
  if (redirectDetected) {
    warnings.push('URL redirect detected — ensure final destination is canonical to avoid crawl equity loss');
  }

  // Response Time / Latency
  if (responseTime > 2000) {
    issues.push(`Slow server response time: ${responseTime}ms (exceeds 2000ms threshold)`);
  } else if (responseTime > 800) {
    warnings.push(`Moderate server response time: ${responseTime}ms (recommended under 600ms)`);
  }

  // Robots.txt
  if (!robotsTxt.exists) {
    warnings.push('robots.txt file not found at website root');
  } else if (!robotsTxt.hasSitemapDirective) {
    warnings.push('robots.txt exists but does not reference the XML sitemap location');
  }

  // Sitemap.xml
  if (!sitemapXml.exists) {
    warnings.push('sitemap.xml file not found at website root');
  } else if (sitemapXml.urlCount === 0) {
    warnings.push('sitemap.xml is present but does not list any URLs');
  }

  // Canonical tag check
  if (mainPage && !mainPage.canonical) {
    warnings.push('Main page is missing a self-referencing canonical URL tag');
  }

  // Indexability check
  if (mainPage?.isNoIndex) {
    issues.push('Main page contains "noindex" meta directive, blocking search engine indexation');
  }

  const deductions = (issues.length * 15) + (warnings.length * 6);
  const score = Math.max(0, Math.min(100, 100 - deductions));

  return {
    score,
    issues,
    warnings,
    data: {
      isHttps,
      httpStatus,
      redirectDetected,
      responseTime,
      robotsTxt: {
        exists: !!robotsTxt.exists,
        hasSitemapDirective: !!robotsTxt.hasSitemapDirective,
      },
      sitemapXml: {
        exists: !!sitemapXml.exists,
        urlCount: sitemapXml.urlCount || 0,
      },
      canonical: mainPage?.canonical || null,
      isIndexable: !mainPage?.isNoIndex,
    },
  };
}

module.exports = { analyzeTechnical };
