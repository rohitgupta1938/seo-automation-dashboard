// src/services/technicalSeoAnalyzer.js

function analyzeTechnical(crawlData) {
  const { httpStatus, isHttps, redirectDetected, robotsTxt, sitemapXml, mainPage } = crawlData;
  const issues = [];
  const warnings = [];

  // HTTPS
  if (!isHttps) issues.push('Site not using HTTPS');

  // HTTP status
  if (httpStatus === 0) issues.push('Website unreachable or timed out');
  else if (httpStatus >= 400) issues.push(`HTTP error: ${httpStatus}`);
  else if (httpStatus >= 300) warnings.push(`Redirect detected (status: ${httpStatus})`);

  // Redirects
  if (redirectDetected) warnings.push('Page redirect detected — may cause link equity loss');

  // Robots.txt
  if (!robotsTxt.exists) issues.push('robots.txt not found');
  else if (!robotsTxt.hasSitemapDirective) warnings.push('robots.txt does not reference sitemap');

  // Sitemap
  if (!sitemapXml.exists) issues.push('sitemap.xml not found');
  else if (sitemapXml.urlCount === 0) warnings.push('sitemap.xml found but contains no URLs');
  else warnings.push(`sitemap.xml found with ${sitemapXml.urlCount} URLs`);

  // Canonical
  if (mainPage && !mainPage.canonical) warnings.push('Main page missing canonical URL');

  // Indexability
  if (mainPage?.isNoIndex) issues.push('Main page has noindex — blocked from search engines');

  const deductions = issues.length * 15 + warnings.length * 5;
  const score = Math.max(0, 100 - deductions);

  return {
    score,
    issues,
    warnings,
    data: {
      isHttps,
      httpStatus,
      redirectDetected,
      robotsTxt: { exists: robotsTxt.exists, hasSitemapDirective: robotsTxt.hasSitemapDirective },
      sitemapXml: { exists: sitemapXml.exists, urlCount: sitemapXml.urlCount },
      canonical: mainPage?.canonical || null,
      isIndexable: !mainPage?.isNoIndex,
    },
  };
}

module.exports = { analyzeTechnical };
