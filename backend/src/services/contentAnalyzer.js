// src/services/contentAnalyzer.js

function analyzeContent(crawlData) {
  const { mainPage, duplicateTitles = [], duplicateDescriptions = [] } = crawlData;
  if (!mainPage) return { score: 0, issues: ['No page content available to analyze'], warnings: [] };

  const issues = [];
  const warnings = [];
  const wordCount = mainPage.wordCount || 0;
  const h1Count = mainPage.headings?.h1?.length || mainPage.h1s?.length || 0;
  const h2Count = mainPage.headings?.h2?.length || mainPage.h2s?.length || 0;
  const intLinkCount = mainPage.internalLinks?.length || 0;

  let baseScore = 70;

  // Word count evaluation
  if (wordCount === 0) {
    issues.push('Thin or empty content: 0 words detected in raw HTML. If this is a single-page app (React/Vue), search bots without full JS rendering cannot index your content');
    baseScore = 25;
  } else if (wordCount < 150) {
    issues.push(`Very thin content: only ${wordCount} words detected (recommended minimum: 300+ words for main landing pages)`);
    baseScore = 40;
  } else if (wordCount < 300) {
    warnings.push(`Light page content: ${wordCount} words. Expanding key service/product explanations will improve ranking potential`);
    baseScore = 60;
  } else if (wordCount >= 600) {
    baseScore = 85;
    if (wordCount >= 1000) baseScore = 95;
  }

  // Heading structure & readability
  if (h1Count === 0) {
    warnings.push('Content lacks a clear H1 topic headline');
    baseScore -= 10;
  }
  if (h2Count === 0 && wordCount > 200) {
    warnings.push('Content lacks H2 sub-sections for reader scannability and semantic structure');
    baseScore -= 5;
  }

  // Duplication penalty
  if (duplicateTitles.length > 0) {
    warnings.push(`Duplicate title tags detected on ${duplicateTitles.length} page(s)`);
    baseScore -= 5;
  }
  if (duplicateDescriptions.length > 0) {
    warnings.push(`Duplicate meta descriptions detected on ${duplicateDescriptions.length} page(s)`);
    baseScore -= 5;
  }

  // Internal linking depth
  if (intLinkCount < 2) {
    warnings.push('Low internal link connectivity on page (less than 2 internal links)');
    baseScore -= 5;
  }

  const score = Math.max(0, Math.min(100, Math.round(baseScore)));

  return {
    score,
    issues,
    warnings,
    data: {
      wordCount,
      h1Count,
      h2Count,
      internalLinksCount: intLinkCount,
      hasStructuredHeadings: h1Count > 0 && h2Count > 0,
    },
  };
}

module.exports = { analyzeContent };
