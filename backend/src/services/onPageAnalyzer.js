// src/services/onPageAnalyzer.js

function analyzeOnPage(crawlData) {
  const { mainPage, pages, duplicateTitles, duplicateDescriptions } = crawlData;
  if (!mainPage) return { score: 0, issues: ['Could not crawl page'] };

  const issues = [];
  const warnings = [];

  // Title analysis
  if (!mainPage.title) issues.push('Missing page title');
  else if (mainPage.title.length < 30) warnings.push(`Title too short: ${mainPage.title.length} chars (aim for 50-60)`);
  else if (mainPage.title.length > 70) warnings.push(`Title too long: ${mainPage.title.length} chars (aim for 50-60)`);

  // Meta description
  if (!mainPage.metaDescription) issues.push('Missing meta description');
  else if (mainPage.metaDescription.length < 100) warnings.push(`Meta description too short: ${mainPage.metaDescription.length} chars`);
  else if (mainPage.metaDescription.length > 165) warnings.push(`Meta description too long: ${mainPage.metaDescription.length} chars`);

  // Headings
  if (!mainPage.h1s || mainPage.h1s.length === 0) issues.push('Missing H1 tag');
  else if (mainPage.h1s.length > 1) warnings.push(`Multiple H1 tags found: ${mainPage.h1s.length}`);

  // Alt attributes
  if (mainPage.imagesWithMissingAlt?.length > 0) {
    issues.push(`${mainPage.imagesWithMissingAlt.length} image(s) missing alt attributes`);
  }

  // Canonical
  if (!mainPage.canonical) warnings.push('Missing canonical URL');

  // Content
  if (mainPage.wordCount < 300) issues.push(`Thin content: only ${mainPage.wordCount} words (aim for 300+)`);

  // Duplicates
  if (duplicateTitles?.length > 0) warnings.push(`Duplicate titles found across pages: ${duplicateTitles.length}`);
  if (duplicateDescriptions?.length > 0) warnings.push(`Duplicate meta descriptions found: ${duplicateDescriptions.length}`);

  // Internal links
  const intLinkCount = mainPage.internalLinks?.length || 0;
  if (intLinkCount < 5) warnings.push(`Low internal links: ${intLinkCount} found`);

  // Noindex
  if (mainPage.isNoIndex) issues.push('Page has noindex directive — will not be indexed');

  // Score calculation
  const deductions = issues.length * 15 + warnings.length * 5;
  const score = Math.max(0, 100 - deductions);

  return {
    score,
    issues,
    warnings,
    data: {
      title: mainPage.title,
      titleLength: mainPage.title?.length || 0,
      metaDescription: mainPage.metaDescription,
      metaDescriptionLength: mainPage.metaDescription?.length || 0,
      h1s: mainPage.h1s,
      h2s: mainPage.h2s,
      wordCount: mainPage.wordCount,
      imagesTotal: mainPage.images?.length || 0,
      imagesMissingAlt: mainPage.imagesWithMissingAlt?.length || 0,
      internalLinksCount: intLinkCount,
      externalLinksCount: mainPage.externalLinks?.length || 0,
      canonical: mainPage.canonical,
      lang: mainPage.lang,
      isNoIndex: mainPage.isNoIndex,
    },
  };
}

module.exports = { analyzeOnPage };
