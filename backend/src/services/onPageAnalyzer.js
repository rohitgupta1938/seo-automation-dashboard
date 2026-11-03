// src/services/onPageAnalyzer.js

function analyzeOnPage(crawlData) {
  const { mainPage, pages, duplicateTitles, duplicateDescriptions } = crawlData;
  if (!mainPage) return { score: 0, issues: ['Could not crawl page'], warnings: [] };

  const issues = [];
  const warnings = [];

  // Title analysis
  if (!mainPage.title) {
    issues.push('Missing page title');
  } else if (mainPage.title.length < 30) {
    warnings.push(`Title tag is short (${mainPage.title.length} characters): "${mainPage.title}". Recommended: 30-65 characters`);
  } else if (mainPage.title.length > 65) {
    warnings.push(`Title tag is long (${mainPage.title.length} characters): may be truncated in search results`);
  }

  // Meta description
  if (!mainPage.metaDescription) {
    issues.push('Missing meta description');
  } else if (mainPage.metaDescription.length < 70) {
    warnings.push(`Meta description is short (${mainPage.metaDescription.length} characters). Recommended: 100-160 characters`);
  } else if (mainPage.metaDescription.length > 165) {
    warnings.push(`Meta description is long (${mainPage.metaDescription.length} characters): may be truncated in snippets`);
  }

  // Headings analysis
  const h1Count = mainPage.headings?.h1?.length || mainPage.h1s?.length || 0;
  const h2Count = mainPage.headings?.h2?.length || mainPage.h2s?.length || 0;
  if (h1Count === 0) {
    issues.push('Missing H1 heading tag');
  } else if (h1Count > 1) {
    warnings.push(`Multiple H1 heading tags found (${h1Count}). Best practice is a single primary H1 tag per page`);
  }

  if (h2Count === 0) {
    warnings.push('No H2 subheadings found for content structure');
  }

  // Viewport / Mobile responsiveness
  if (!mainPage.viewport) {
    issues.push('Missing viewport meta tag (<meta name="viewport">) for mobile responsiveness');
  }

  // Canonical tag
  if (!mainPage.canonical) {
    warnings.push('Missing canonical URL tag to prevent duplicate content indexing');
  }

  // Open Graph & Social metadata
  const og = mainPage.openGraph || {};
  if (!og.title && !og.description) {
    warnings.push('Missing Open Graph metadata (og:title, og:description) for social sharing');
  }

  // Image Alt tags
  const imagesTotal = mainPage.images?.length || 0;
  const imagesMissingAlt = mainPage.imagesWithMissingAlt?.length || 0;
  if (imagesTotal > 0 && imagesMissingAlt > 0) {
    const percentMissing = Math.round((imagesMissingAlt / imagesTotal) * 100);
    if (imagesMissingAlt > 3) {
      issues.push(`${imagesMissingAlt} of ${imagesTotal} images (${percentMissing}%) missing alt attributes`);
    } else {
      warnings.push(`${imagesMissingAlt} image(s) missing descriptive alt attributes`);
    }
  }

  // Language attribute
  if (!mainPage.lang) {
    warnings.push('Missing HTML lang attribute on <html> element');
  }

  // Duplicates across discovered pages
  if (duplicateTitles?.length > 0) {
    warnings.push(`Duplicate title tags found across ${duplicateTitles.length} page(s)`);
  }
  if (duplicateDescriptions?.length > 0) {
    warnings.push(`Duplicate meta descriptions found across ${duplicateDescriptions.length} page(s)`);
  }

  // Deductions
  const deductions = (issues.length * 15) + (warnings.length * 5);
  const score = Math.max(0, Math.min(100, 100 - deductions));

  return {
    score,
    issues,
    warnings,
    data: {
      title: mainPage.title || '',
      titleLength: mainPage.title?.length || 0,
      metaDescription: mainPage.metaDescription || '',
      metaDescriptionLength: mainPage.metaDescription?.length || 0,
      headings: mainPage.headings || { h1: mainPage.h1s || [], h2: mainPage.h2s || [] },
      h1s: mainPage.headings?.h1 || mainPage.h1s || [],
      h2s: mainPage.headings?.h2 || mainPage.h2s || [],
      wordCount: mainPage.wordCount || 0,
      imagesTotal,
      imagesMissingAlt,
      imagesWithMissingAlt: (mainPage.imagesWithMissingAlt || []).slice(0, 10),
      internalLinksCount: mainPage.internalLinks?.length || 0,
      externalLinksCount: mainPage.externalLinks?.length || 0,
      canonical: mainPage.canonical || '',
      lang: mainPage.lang || '',
      viewport: mainPage.viewport || '',
      openGraph: mainPage.openGraph || {},
      isNoIndex: mainPage.isNoIndex || false,
    },
  };
}

module.exports = { analyzeOnPage };
