// src/ai/seoAnalyzer.js
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../config/logger');

function generateDeterministicAnalysis({
  url,
  domain,
  businessType = 'general',
  city,
  state,
  onPageData = {},
  technicalData = {},
  contentData = {},
  schemaData = {},
  cwvData = {},
  scores = {},
}) {
  const onPageIssues = onPageData.issues || [];
  const onPageWarnings = onPageData.warnings || [];
  const techIssues = technicalData.issues || [];
  const techWarnings = technicalData.warnings || [];
  const contentIssues = contentData.issues || [];
  const contentWarnings = contentData.warnings || [];
  const schemaIssues = schemaData.issues || [];

  const opData = onPageData.data || {};
  const tData = technicalData.data || {};
  const sData = schemaData.data || {};

  const criticalIssues = [];
  const importantIssues = [];
  const quickWins = [];
  const recommendations = [];

  // 1. Analyze On-Page Findings
  if (!opData.title) {
    criticalIssues.push(`Missing <title> tag on ${domain} — search engines cannot determine page relevance`);
    recommendations.push({
      priority: 'CRITICAL',
      category: 'OnPage',
      finding: `Root page on ${domain} is completely missing a <title> tag`,
      fix: `Add a descriptive, keyword-rich <title> tag between 30 and 60 characters (e.g. "${domain.split('.')[0]} — Official Site")`,
      estimated_impact: 'High',
      effort: 'Hours',
      falsifiability_check: 'View Page Source confirms <title> presence; Google search snippet displays intended brand title within 1-2 weeks',
    });
    quickWins.push(`Add a primary <title> tag to ${domain} (Est. 30 mins)`);
  } else if (opData.titleLength < 30) {
    importantIssues.push(`Title tag is too short (${opData.titleLength} chars): "${opData.title}"`);
    recommendations.push({
      priority: 'HIGH',
      category: 'OnPage',
      finding: `Page title "${opData.title}" is only ${opData.titleLength} characters, underutilizing available SERP pixel width`,
      fix: `Expand title to 45–60 characters by adding key differentiators or services (e.g. "${opData.title} | ${businessType.charAt(0).toUpperCase() + businessType.slice(1)} Solutions")`,
      estimated_impact: 'Medium',
      effort: 'Hours',
      falsifiability_check: 'SERP preview simulators show full title utilization; GSC CTR increases over 30 days',
    });
    quickWins.push(`Expand homepage title tag from "${opData.title}" to 45-60 characters (Est. 30 mins)`);
  }

  if (!opData.metaDescription) {
    criticalIssues.push(`Missing meta description on ${domain} — Google will auto-generate snippets from arbitrary text`);
    recommendations.push({
      priority: 'CRITICAL',
      category: 'OnPage',
      finding: `Homepage has no <meta name="description"> tag`,
      fix: `Write a compelling 120-160 character meta description highlighting value proposition, targeted keywords, and a call-to-action`,
      estimated_impact: 'High',
      effort: 'Hours',
      falsifiability_check: 'Google Search snippet displays the exact meta description on brand search queries',
    });
    quickWins.push(`Write and deploy a 140-character meta description for ${domain} (Est. 1 hour)`);
  } else if (opData.metaDescriptionLength < 70) {
    importantIssues.push(`Meta description is short (${opData.metaDescriptionLength} chars) — lacks detailed value proposition`);
  }

  const h1List = opData.h1s || [];
  if (h1List.length === 0) {
    criticalIssues.push(`Missing H1 heading tag on ${domain} homepage`);
    recommendations.push({
      priority: 'HIGH',
      category: 'OnPage',
      finding: 'No <h1> heading tag found in page HTML structure',
      fix: 'Introduce a single, semantic <h1> tag at the top of the main content that reflects the primary purpose of the website',
      estimated_impact: 'High',
      effort: 'Hours',
      falsifiability_check: 'HTML validator and Chrome DOM inspector confirm exactly one prominent <h1> tag on the page',
    });
    quickWins.push(`Add a single semantic <h1> heading to the homepage (Est. 45 mins)`);
  } else if (h1List.length > 1) {
    importantIssues.push(`Multiple H1 headings detected (${h1List.length}) on single page`);
  }

  if (opData.imagesMissingAlt > 0) {
    const isMajor = opData.imagesMissingAlt > 3;
    const issueText = `${opData.imagesMissingAlt} of ${opData.imagesTotal} image(s) on ${domain} lack descriptive alt attributes`;
    if (isMajor) criticalIssues.push(issueText);
    else importantIssues.push(issueText);

    recommendations.push({
      priority: isMajor ? 'HIGH' : 'MEDIUM',
      category: 'OnPage',
      finding: issueText,
      fix: 'Add descriptive alt="" attributes with meaningful descriptions to all non-decorative <img> tags for accessibility and image search indexing',
      estimated_impact: 'Medium',
      effort: 'Hours',
      falsifiability_check: 'Lighthouse Accessibility and SEO audit passes image-alt check with 100% score',
    });
    quickWins.push(`Add descriptive alt attributes to the ${opData.imagesMissingAlt} images missing them (Est. 1 hour)`);
  }

  // 2. Technical Findings
  if (!tData.isHttps) {
    criticalIssues.push(`Website is not secure: served over HTTP instead of HTTPS`);
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Technical',
      finding: 'Website is currently loaded over insecure HTTP protocol',
      fix: 'Install an SSL certificate (e.g. Let\'s Encrypt / Cloudflare) and enforce 301 redirection from HTTP to HTTPS',
      estimated_impact: 'High',
      effort: 'Hours',
      falsifiability_check: 'Browser shows secure lock icon; curl -I redirects http:// to https:// with 301',
    });
  }

  if (!tData.robotsTxt?.exists) {
    importantIssues.push(`robots.txt file not found at ${domain}/robots.txt`);
    recommendations.push({
      priority: 'HIGH',
      category: 'Technical',
      finding: `No robots.txt found at ${url.replace(/\/$/, '')}/robots.txt`,
      fix: `Deploy a standard robots.txt file with User-agent: * and Sitemap directive linking to your XML sitemap`,
      estimated_impact: 'Medium',
      effort: 'Hours',
      falsifiability_check: 'Navigating to /robots.txt returns HTTP 200 with valid directives; GSC robots testing tool confirms valid syntax',
    });
    quickWins.push(`Create and upload a basic robots.txt file (Est. 30 mins)`);
  }

  if (!tData.sitemapXml?.exists) {
    importantIssues.push(`sitemap.xml not found at ${domain}/sitemap.xml`);
    recommendations.push({
      priority: 'HIGH',
      category: 'Technical',
      finding: 'No XML sitemap found at standard root location',
      fix: 'Generate an automated sitemap.xml listing all canonical URLs and submit it to Google Search Console',
      estimated_impact: 'High',
      effort: 'Hours',
      falsifiability_check: 'sitemap.xml loads with valid XML header; submitted to GSC with status "Success"',
    });
  }

  if (!opData.canonical) {
    importantIssues.push('Missing self-referencing canonical URL tag (<link rel="canonical">)');
  }

  // 3. Content Analysis
  const wordCount = opData.wordCount || 0;
  if (wordCount === 0) {
    criticalIssues.push(`Thin/Blank HTML detected: 0 words found in raw HTML. If built with a client-side framework (React/Vue), search bots without full JS execution cannot read the content`);
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Content',
      finding: `Zero indexable words detected in raw HTML on ${domain}`,
      fix: 'Implement Server-Side Rendering (SSR), Static Site Generation (SSG), or pre-rendering so essential body content and metadata exist in raw HTML response',
      estimated_impact: 'High',
      effort: 'Days',
      falsifiability_check: 'Fetching page with curl/Fetch API returns full HTML textual content instead of an empty root container',
    });
  } else if (wordCount < 200) {
    importantIssues.push(`Page content is thin (${wordCount} words) — expands ranking opportunity if expanded`);
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Content',
      finding: `Homepage has thin body copy (${wordCount} words)`,
      fix: 'Expand key content sections to at least 400–600 words with in-depth descriptions of services, portfolio items, or features',
      estimated_impact: 'Medium',
      effort: 'Days',
      falsifiability_check: 'Word count exceeds 400 words; average time on page and keyword rankings increase',
    });
  }

  // 4. Schema Findings
  if (!schemaData.hasStructuredData || schemaData.schemaCount === 0) {
    const recommendedSchemaType = businessType.toLowerCase().includes('shop') || businessType.toLowerCase().includes('store')
      ? 'Product / Store / Organization'
      : businessType.toLowerCase().includes('portfolio')
      ? 'Person / ProfilePage / WebSite'
      : businessType.toLowerCase().includes('local') || businessType.toLowerCase().includes('dentist')
      ? 'LocalBusiness'
      : 'Organization / WebSite';

    criticalIssues.push(`No Schema.org structured data found on ${domain}`);
    recommendations.push({
      priority: 'HIGH',
      category: 'Schema',
      finding: `No JSON-LD structured data detected on ${domain}`,
      fix: `Add Schema.org JSON-LD structured data matching your business type: ${recommendedSchemaType} with name, url, description, and contact info`,
      estimated_impact: 'High',
      effort: 'Hours',
      falsifiability_check: 'Google Rich Results Test confirms valid structured data with 0 errors and 0 warnings',
    });
    quickWins.push(`Add ${recommendedSchemaType.split('/')[0].trim()} JSON-LD schema markup to homepage (Est. 1 hour)`);
  }

  // 5. Core Web Vitals / Speed
  const respTime = tData.responseTime || 0;
  if (respTime > 1200) {
    importantIssues.push(`Server response time (TTFB) is high: ${respTime}ms`);
    recommendations.push({
      priority: 'HIGH',
      category: 'CWV',
      finding: `Initial server response time was ${respTime}ms, exceeding the Google recommended 600ms threshold`,
      fix: 'Enable edge CDN caching, optimize database queries, and enable Gzip/Brotli HTTP compression on the origin server',
      estimated_impact: 'High',
      effort: 'Days',
      falsifiability_check: 'Chrome DevTools Network tab shows TTFB consistently below 500ms worldwide',
    });
  }

  // Ensure lists have items and are bounded
  const topCritical = criticalIssues.slice(0, 5);
  const topImportant = importantIssues.slice(0, 8);
  const topQuickWins = quickWins.slice(0, 5);

  const breakdown = {
    technical: scores.technicalScore != null ? scores.technicalScore : 70,
    on_page: scores.onPageScore != null ? scores.onPageScore : 65,
    content: scores.contentScore != null ? scores.contentScore : 60,
    core_web_vitals: scores.cwvScore != null ? scores.cwvScore : 75,
    schema: scores.schemaScore != null ? scores.schemaScore : 0,
  };

  const calculatedOverall = scores.overallScore != null
    ? scores.overallScore
    : Math.round(breakdown.technical * 0.25 + breakdown.on_page * 0.25 + breakdown.content * 0.20 + breakdown.core_web_vitals * 0.15 + breakdown.schema * 0.15);

  const summary = `SEO audit for ${domain} (${businessType}) resulted in an overall score of ${calculatedOverall}/100. ` +
    `Technical score stands at ${breakdown.technical}/100, on-page SEO is ${breakdown.on_page}/100, and content readiness is ${breakdown.content}/100. ` +
    (topCritical.length > 0
      ? `Primary action items require resolving ${topCritical.length} critical issue(s): ${topCritical[0]}. `
      : 'Core technical health is solid with no major blockers. ') +
    (schemaData.hasStructuredData ? 'Structured data is present. ' : 'Adding Schema.org structured data will unlock rich snippet eligibility. ') +
    'Addressing the quick wins outlined below provides immediate ranking and crawl efficiency gains.';

  return {
    audit_version: 'v2.0-site-specific',
    overall_score: calculatedOverall,
    score_breakdown: breakdown,
    critical_issues: topCritical.length > 0 ? topCritical : ['No critical blockers detected; maintain continuous monitoring'],
    important_issues: topImportant.length > 0 ? topImportant : ['Review internal link depth and monitor Core Web Vitals field data'],
    quick_wins: topQuickWins.length > 0 ? topQuickWins : ['Submit updated sitemap to Google Search Console (Est. 15 mins)'],
    recommendations: recommendations.length > 0 ? recommendations : [
      {
        priority: 'MEDIUM',
        category: 'Technical',
        finding: `Site structure on ${domain} is sound`,
        fix: 'Continue monitoring Google Search Console performance and maintain regular crawl audits',
        estimated_impact: 'Medium',
        effort: 'Hours',
        falsifiability_check: 'Continuous indexation health in Google Search Console',
      }
    ],
    executive_summary: summary,
  };
}

function enforceConstraints(analysis, computedScores = {}) {
  if (!analysis || typeof analysis !== 'object') throw new Error('Invalid AI response structure');

  if (Array.isArray(analysis.critical_issues)) analysis.critical_issues = analysis.critical_issues.slice(0, 5);
  if (Array.isArray(analysis.important_issues)) analysis.important_issues = analysis.important_issues.slice(0, 8);
  if (Array.isArray(analysis.quick_wins)) analysis.quick_wins = analysis.quick_wins.slice(0, 5);

  if (typeof analysis.overall_score === 'number') {
    analysis.overall_score = Math.min(100, Math.max(0, Math.round(analysis.overall_score)));
  }
  if (analysis.score_breakdown) {
    for (const k of Object.keys(analysis.score_breakdown)) {
      analysis.score_breakdown[k] = Math.min(100, Math.max(0, Math.round(analysis.score_breakdown[k] || 0)));
    }
  }

  const required = ['audit_version', 'overall_score', 'score_breakdown', 'critical_issues', 'important_issues', 'quick_wins', 'recommendations', 'executive_summary'];
  for (const field of required) {
    if (!(field in analysis)) throw new Error(`Missing required field in AI response: ${field}`);
  }

  return analysis;
}

async function analyzeSEO({
  url,
  businessType = 'general',
  city,
  state,
  onPageData,
  technicalData,
  contentData,
  cwvData,
  schemaData,
  gscData,
  rankingsData,
  computedScores = {},
}) {
  let hostname = url;
  try { hostname = new URL(url).hostname; } catch {}

  // If Anthropic API key is available, utilize Claude
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'mock') {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const systemPrompt = `You are a senior SEO analyst with 15+ years of experience auditing enterprise and local business websites.
You produce honest, falsifiable, prioritised SEO audit reports based STRICTLY on the actual crawled data provided.
Do NOT fabricate generic dental clinic issues or hardcode scores. Use the actual crawled signals and metrics.
Your output must be valid JSON only — no markdown, no preamble.

Every recommendation must include:
- finding (specific to the crawled website)
- fix (actionable steps)
- estimated_impact (High/Medium/Low)
- effort (Hours/Days/Weeks)
- falsifiability_check (how to verify)`;

      const userPrompt = `Analyse the following real crawled SEO signals for: ${url} (Domain: ${hostname})
Business type: ${businessType || 'general'}
Location: ${city || 'Unknown'}, ${state || 'Unknown'}

Pre-computed benchmark scores:
${JSON.stringify(computedScores, null, 2)}

=== REAL ON-PAGE CRAWL DATA ===
${JSON.stringify(onPageData, null, 2)}

=== REAL TECHNICAL SEO DATA ===
${JSON.stringify(technicalData, null, 2)}

=== REAL CONTENT METRICS ===
${JSON.stringify(contentData, null, 2)}

=== CORE WEB VITALS / PERFORMANCE ===
${JSON.stringify(cwvData, null, 2)}

=== SCHEMA.ORG DATA ===
${JSON.stringify(schemaData, null, 2)}

Respond ONLY with this JSON structure:
{
  "audit_version": "v2.0-claude",
  "overall_score": ${computedScores.overallScore || 65},
  "score_breakdown": {
    "technical": ${computedScores.technicalScore || 70},
    "on_page": ${computedScores.onPageScore || 65},
    "content": ${computedScores.contentScore || 60},
    "core_web_vitals": ${computedScores.cwvScore || 70},
    "schema": ${computedScores.schemaScore || 0}
  },
  "critical_issues": ["<specific issue 1>", "<specific issue 2>"],
  "important_issues": ["<specific issue 1>", "<specific issue 2>"],
  "quick_wins": ["<actionable win 1>", "<actionable win 2>"],
  "recommendations": [
    {
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "Technical|OnPage|Content|Schema|CWV",
      "finding": "<specific finding on ${hostname}>",
      "fix": "<practical actionable fix>",
      "estimated_impact": "High|Medium|Low",
      "effort": "Hours|Days|Weeks",
      "falsifiability_check": "<measurable check>"
    }
  ],
  "executive_summary": "<thorough tailored summary of ${hostname}>"
}`;

      logger.info('Sending real SEO crawl data to Claude', { url, model: 'claude-sonnet-4-6' });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const rawContent = response.content[0]?.text;
      if (rawContent) {
        const cleaned = rawContent.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return enforceConstraints(parsed, computedScores);
      }
    } catch (err) {
      logger.warn('Claude API request failed, falling back to deterministic site-specific analyzer', { error: err.message });
    }
  }

  // Deterministic, site-specific SEO analysis engine
  logger.info('Generating dynamic site-specific SEO recommendations from real crawl data', { url, hostname });
  const analysis = generateDeterministicAnalysis({
    url,
    domain: hostname,
    businessType,
    city,
    state,
    onPageData,
    technicalData,
    contentData,
    schemaData,
    cwvData,
    scores: computedScores,
  });

  return enforceConstraints(analysis, computedScores);
}

module.exports = { analyzeSEO };
