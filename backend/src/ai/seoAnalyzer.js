// src/ai/seoAnalyzer.js
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../config/logger');

const USE_AI_MOCK = process.env.USE_MOCKS === 'true' && !process.env.ANTHROPIC_API_KEY;

function getMockAnalysis(websiteData) {
  return {
    audit_version: 'v1.0',
    overall_score: 52,
    score_breakdown: { technical: 55, on_page: 48, content: 50, core_web_vitals: 61, schema: 30 },
    critical_issues: [
      'No LocalBusiness schema markup found — critical for local SEO visibility',
      'Page speed performance score of 61% on mobile is below acceptable threshold',
      'Missing or incomplete meta descriptions on key pages',
    ],
    important_issues: [
      'LCP of 4.2s exceeds Google recommended 2.5s threshold',
      '420 KiB of unused JavaScript is slowing page load',
      '2 render-blocking resources impeding First Contentful Paint',
      'Low average CTR of 3.2–4.4% across tracked keywords',
      'Keyword position averages between 6–11 — just outside top-5 visibility',
    ],
    quick_wins: [
      'Add LocalBusiness / Dentist JSON-LD schema (Est. 1 hour)',
      'Write unique meta descriptions for each page (Est. 2 hours)',
      'Enable browser caching via .htaccess or CDN headers (Est. 1 hour)',
    ],
    recommendations: [
      {
        priority: 'CRITICAL',
        category: 'Schema',
        finding: 'No LocalBusiness schema markup found',
        fix: 'Add Dentist/LocalBusiness JSON-LD with name, address, telephone, openingHours, and geo coordinates',
        estimated_impact: 'High',
        effort: 'Hours',
        falsifiability_check: 'Google Rich Results Test passes; local pack impressions increase in GSC within 4 weeks',
      },
      {
        priority: 'CRITICAL',
        category: 'CWV',
        finding: 'Largest Contentful Paint of 4.2s on mobile',
        fix: 'Optimize hero image (compress, use WebP, add loading="eager" + fetchpriority="high"), defer non-critical scripts',
        estimated_impact: 'High',
        effort: 'Days',
        falsifiability_check: 'PageSpeed Insights LCP drops below 2.5s; Core Web Vitals report in GSC shows green status',
      },
      {
        priority: 'HIGH',
        category: 'Technical',
        finding: '420 KiB unused JavaScript',
        fix: 'Audit JS bundles, implement code splitting, defer/async non-critical scripts, remove unused plugins',
        estimated_impact: 'High',
        effort: 'Days',
        falsifiability_check: 'Coverage tab in Chrome DevTools shows <10% unused code; PageSpeed score improves by 10+ points',
      },
      {
        priority: 'HIGH',
        category: 'OnPage',
        finding: 'Average keyword position between 6–11 for primary dental queries',
        fix: 'Create dedicated landing pages for "dental clinic pune" and "dentist near me" with geo-targeted content, patient testimonials, and FAQ schema',
        estimated_impact: 'High',
        effort: 'Weeks',
        falsifiability_check: 'GSC shows target keywords entering positions 1–5 within 8–12 weeks of page publish',
      },
      {
        priority: 'MEDIUM',
        category: 'Content',
        finding: 'Low CTR on "dentist near me" despite 2100 impressions',
        fix: 'A/B test title tags with location + offer (e.g., "Best Dentist Near Me in Pune | Free Consultation")',
        estimated_impact: 'Medium',
        effort: 'Hours',
        falsifiability_check: 'CTR for query improves from 3.2% to 5%+ in GSC within 30 days',
      },
    ],
    executive_summary: '[MOCK AI] This dental clinic website scores 52/100 overall. Critical gaps include missing LocalBusiness schema and poor Core Web Vitals. Priority actions: implement schema markup, optimize LCP, and reduce unused JS. These changes could realistically move primary keywords from positions 6–11 into top 5 within 8–12 weeks.',
  };
}

function enforceConstraints(analysis) {
  if (!analysis || typeof analysis !== 'object') throw new Error('Invalid AI response structure');

  // Enforce counts
  if (Array.isArray(analysis.critical_issues)) analysis.critical_issues = analysis.critical_issues.slice(0, 5);
  if (Array.isArray(analysis.important_issues)) analysis.important_issues = analysis.important_issues.slice(0, 8);
  if (Array.isArray(analysis.quick_wins)) analysis.quick_wins = analysis.quick_wins.slice(0, 5);

  // Clamp scores
  const scoreFields = ['overall_score', ...Object.keys(analysis.score_breakdown || {})];
  if (typeof analysis.overall_score === 'number') {
    analysis.overall_score = Math.min(100, Math.max(0, Math.round(analysis.overall_score)));
  }
  if (analysis.score_breakdown) {
    for (const k of Object.keys(analysis.score_breakdown)) {
      analysis.score_breakdown[k] = Math.min(100, Math.max(0, Math.round(analysis.score_breakdown[k] || 0)));
    }
  }

  // Required fields
  const required = ['audit_version', 'overall_score', 'score_breakdown', 'critical_issues', 'important_issues', 'quick_wins', 'recommendations', 'executive_summary'];
  for (const field of required) {
    if (!(field in analysis)) throw new Error(`Missing required field in AI response: ${field}`);
  }

  return analysis;
}

async function analyzeSEO({ url, businessType, city, state, onPageData, technicalData, cwvData, schemaData, gscData, rankingsData }) {
  if (USE_AI_MOCK || !process.env.ANTHROPIC_API_KEY) {
    logger.info('[MOCK AI] Returning mock SEO analysis (no ANTHROPIC_API_KEY set)');
    return getMockAnalysis({ url });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a senior SEO analyst with 15+ years experience specialising in Indian local business websites, healthcare, dental, and real estate sectors.

You produce honest, falsifiable, prioritised SEO audit reports.

Your output must be valid JSON only — no markdown, no preamble.

Every recommendation must include:
- finding
- fix
- estimated_impact (High/Medium/Low)
- effort (Hours/Days/Weeks)
- falsifiability_check (how we know if this worked)`;

  const userPrompt = `Analyse the following SEO signals for: ${url}

Business type: ${businessType || 'general'}

Business location: ${city || 'Unknown'}, ${state || 'Unknown'}, India

=== ON-PAGE DATA ===
${JSON.stringify(onPageData, null, 2)}

=== TECHNICAL DATA ===
${JSON.stringify(technicalData, null, 2)}

=== CORE WEB VITALS ===
${JSON.stringify(cwvData, null, 2)}

=== SCHEMA.ORG DATA ===
${JSON.stringify(schemaData, null, 2)}

=== GOOGLE SEARCH CONSOLE ===
${JSON.stringify(gscData, null, 2)}

=== KEYWORD RANKINGS ===
${JSON.stringify(rankingsData, null, 2)}

Respond ONLY with this JSON structure:

{
  "audit_version": "v1.0",
  "overall_score": 0,
  "score_breakdown": {
    "technical": 0,
    "on_page": 0,
    "content": 0,
    "core_web_vitals": 0,
    "schema": 0
  },
  "critical_issues": [],
  "important_issues": [],
  "quick_wins": [],
  "recommendations": [
    {
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "Technical|OnPage|Content|Schema|CWV",
      "finding": "",
      "fix": "",
      "estimated_impact": "High|Medium|Low",
      "effort": "Hours|Days|Weeks",
      "falsifiability_check": ""
    }
  ],
  "executive_summary": ""
}`;

  logger.info('Sending SEO data to Claude', { url, model: 'claude-sonnet-4-6' });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawContent = response.content[0]?.text;
  if (!rawContent) throw new Error('Empty response from Claude');

  let parsed;
  try {
    // Strip any markdown fencing if Claude slips
    const cleaned = rawContent.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    logger.error('Failed to parse Claude JSON response', { raw: rawContent.slice(0, 500) });
    throw new Error(`Claude returned invalid JSON: ${err.message}`);
  }

  return enforceConstraints(parsed);
}

module.exports = { analyzeSEO };
