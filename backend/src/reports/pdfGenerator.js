// src/reports/pdfGenerator.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

const REPORTS_DIR = process.env.REPORTS_DIR || path.join(__dirname, '../../reports');

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function getScoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function renderRecommendationRows(recommendations = []) {
  return recommendations.map(r => `
    <tr>
      <td><span class="badge badge-${r.priority.toLowerCase()}">${r.priority}</span></td>
      <td>${r.category}</td>
      <td>${r.finding}</td>
      <td>${r.fix}</td>
      <td>${r.estimated_impact}</td>
      <td>${r.effort}</td>
    </tr>`).join('');
}

function buildHtml(websiteData, auditResult, reportDate) {
  const { url, name, businessType, city, state } = websiteData;
  const {
    overallScore = 0,
    technicalScore = 0,
    onPageScore = 0,
    contentScore = 0,
    cwvScore = 0,
    schemaScore = 0,
    criticalIssues = [],
    importantIssues = [],
    quickWins = [],
    recommendations = [],
    executiveSummary = '',
    pageSpeedData,
    gscData,
    rankingsData,
  } = auditResult;

  const psd = pageSpeedData || {};
  const gsc = gscData || {};
  const rankings = rankingsData || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SEO Audit Report — ${name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 13px; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: white; padding: 40px 48px; }
  .header h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .header .subtitle { color: #94a3b8; margin-top: 8px; font-size: 14px; }
  .header .meta { display: flex; gap: 32px; margin-top: 20px; font-size: 12px; color: #cbd5e1; }
  .content { padding: 36px 48px; }
  .section { margin-bottom: 36px; }
  .section-title { font-size: 18px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
  .score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .score-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; }
  .score-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .score-card .value { font-size: 36px; font-weight: 800; }
  .overall-score { background: linear-gradient(135deg, #0f172a, #1e3a5f); color: white; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px; }
  .overall-score .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  .overall-score .value { font-size: 72px; font-weight: 900; margin: 8px 0; }
  .overall-score .out-of { font-size: 20px; color: #94a3b8; }
  .issue-list { list-style: none; }
  .issue-list li { padding: 10px 14px; border-left: 3px solid; border-radius: 0 8px 8px 0; margin-bottom: 8px; background: #f8fafc; font-size: 13px; line-height: 1.5; }
  .critical li { border-color: #ef4444; }
  .important li { border-color: #f59e0b; }
  .quickwin li { border-color: #10b981; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; }
  td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .badge-critical { background: #fee2e2; color: #dc2626; }
  .badge-high { background: #fef3c7; color: #d97706; }
  .badge-medium { background: #dbeafe; color: #2563eb; }
  .badge-low { background: #f0fdf4; color: #16a34a; }
  .cwv-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
  .cwv-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .cwv-card .metric { font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
  .cwv-card .val { font-size: 18px; font-weight: 700; }
  .exec-summary { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; line-height: 1.7; color: #0c4a6e; }
  .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; }
  @media print { .content { padding: 24px 32px; } }
</style>
</head>
<body>
<div class="header">
  <h1>SEO Audit Report</h1>
  <div class="subtitle">Powered by Edgelink SEO Dashboard</div>
  <div class="meta">
    <span>🌐 ${url}</span>
    <span>🏢 ${name}</span>
    <span>📅 ${reportDate}</span>
    <span>📍 ${city || 'N/A'}, ${state || 'N/A'}</span>
    <span>🏷️ ${businessType}</span>
  </div>
</div>

<div class="content">
  <!-- Overall Score -->
  <div class="section">
    <div class="overall-score">
      <div class="label">Overall SEO Score</div>
      <div class="value" style="color:${getScoreColor(overallScore)}">${overallScore}</div>
      <div class="out-of">/100</div>
    </div>

    <div class="score-grid">
      <div class="score-card"><div class="label">Technical SEO</div><div class="value" style="color:${getScoreColor(technicalScore)}">${technicalScore}</div></div>
      <div class="score-card"><div class="label">On-Page SEO</div><div class="value" style="color:${getScoreColor(onPageScore)}">${onPageScore}</div></div>
      <div class="score-card"><div class="label">Content</div><div class="value" style="color:${getScoreColor(contentScore)}">${contentScore}</div></div>
      <div class="score-card"><div class="label">Core Web Vitals</div><div class="value" style="color:${getScoreColor(cwvScore)}">${cwvScore}</div></div>
      <div class="score-card"><div class="label">Schema.org</div><div class="value" style="color:${getScoreColor(schemaScore)}">${schemaScore}</div></div>
      <div class="score-card"><div class="label">GSC Performance</div><div class="value" style="color:#0ea5e9">${gsc.totalClicks || 0} clicks</div></div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="exec-summary">${executiveSummary || 'No summary available.'}</div>
  </div>

  <!-- Critical Issues -->
  ${Array.isArray(criticalIssues) && criticalIssues.length > 0 ? `
  <div class="section">
    <div class="section-title">🚨 Critical Issues (${criticalIssues.length})</div>
    <ul class="issue-list critical">${criticalIssues.map(i => `<li>${i}</li>`).join('')}</ul>
  </div>` : ''}

  <!-- Important Issues -->
  ${Array.isArray(importantIssues) && importantIssues.length > 0 ? `
  <div class="section">
    <div class="section-title">⚠️ Important Issues (${importantIssues.length})</div>
    <ul class="issue-list important">${importantIssues.map(i => `<li>${i}</li>`).join('')}</ul>
  </div>` : ''}

  <!-- Quick Wins -->
  ${Array.isArray(quickWins) && quickWins.length > 0 ? `
  <div class="section">
    <div class="section-title">✅ Quick Wins (${quickWins.length})</div>
    <ul class="issue-list quickwin">${quickWins.map(i => `<li>${i}</li>`).join('')}</ul>
  </div>` : ''}

  <!-- Core Web Vitals -->
  ${psd.audits ? `
  <div class="section">
    <div class="section-title">⚡ Core Web Vitals</div>
    <div class="cwv-grid">
      <div class="cwv-card"><div class="metric">Performance</div><div class="val" style="color:${getScoreColor(Math.round((psd.categories?.performance?.score||0)*100))}">${Math.round((psd.categories?.performance?.score||0)*100)}</div></div>
      <div class="cwv-card"><div class="metric">LCP</div><div class="val">${psd.audits['largest-contentful-paint']?.displayValue || 'N/A'}</div></div>
      <div class="cwv-card"><div class="metric">CLS</div><div class="val">${psd.audits['cumulative-layout-shift']?.displayValue || 'N/A'}</div></div>
      <div class="cwv-card"><div class="metric">INP</div><div class="val">${psd.audits['interaction-to-next-paint']?.displayValue || 'N/A'}</div></div>
      <div class="cwv-card"><div class="metric">Unused JS</div><div class="val">${psd.audits['unused-javascript']?.displayValue || 'N/A'}</div></div>
    </div>
  </div>` : ''}

  <!-- Search Console Data -->
  ${gsc.rows ? `
  <div class="section">
    <div class="section-title">📊 Google Search Console</div>
    <table>
      <thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
      <tbody>
        ${gsc.rows.map(r => `<tr><td>${r.query}</td><td>${r.clicks}</td><td>${r.impressions}</td><td>${(r.ctr*100).toFixed(1)}%</td><td>${r.position}</td></tr>`).join('')}
      </tbody>
    </table>
    <div style="margin-top:12px;color:#64748b;font-size:12px;">Total Clicks: ${gsc.totalClicks} | Total Impressions: ${gsc.totalImpressions} | Index Errors: ${gsc.indexCoverageErrors}</div>
  </div>` : ''}

  <!-- Keyword Rankings -->
  ${rankings.tasks ? `
  <div class="section">
    <div class="section-title">🏆 Keyword Rankings</div>
    <table>
      <thead><tr><th>Domain</th><th>Rank Group</th><th>Rank (Absolute)</th><th>Type</th></tr></thead>
      <tbody>
        ${(rankings.tasks[0]?.result[0]?.items || []).map(i => `<tr><td><strong>${i.domain}</strong></td><td>#${i.rank_group}</td><td>#${i.rank_absolute}</td><td>${i.type}</td></tr>`).join('')}
      </tbody>
    </table>
    <div style="margin-top:12px;color:#64748b;font-size:12px;">Keyword: "${rankings.tasks[0]?.result[0]?.keyword}" | Search Volume: ${rankings.keyword_search_volume?.toLocaleString() || 'N/A'}/mo | Client Position: #${rankings.client_rank_position}</div>
  </div>` : ''}

  <!-- Detailed Recommendations -->
  ${Array.isArray(recommendations) && recommendations.length > 0 ? `
  <div class="section">
    <div class="section-title">📋 Detailed Recommendations</div>
    <table>
      <thead><tr><th>Priority</th><th>Category</th><th>Finding</th><th>Fix</th><th>Impact</th><th>Effort</th></tr></thead>
      <tbody>${renderRecommendationRows(recommendations)}</tbody>
    </table>
  </div>` : ''}

  <!-- Next Steps -->
  <div class="section">
    <div class="section-title">🗓️ Suggested Next Steps</div>
    <ol style="padding-left:20px;line-height:2;">
      <li>Address all critical issues within the first week</li>
      <li>Implement quick wins immediately (< 2 hours each)</li>
      <li>Schedule Core Web Vitals optimization sprint</li>
      <li>Add LocalBusiness / ${businessType} schema markup</li>
      <li>Create geo-targeted landing pages for priority keywords</li>
      <li>Re-audit in 30 days to measure progress</li>
    </ol>
  </div>
</div>

<div class="footer">
  Generated by Edgelink SEO Dashboard &bull; ${reportDate} &bull; Confidential &bull; Page 1
</div>
</body>
</html>`;
}

async function generatePDFReport(websiteData, auditResult, auditId) {
  ensureReportsDir();

  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fileName = `seo-report-${auditId}-${Date.now()}.pdf`;
  const filePath = path.join(REPORTS_DIR, fileName);

  const html = buildHtml(websiteData, auditResult, reportDate);

  logger.info('Launching Puppeteer for PDF generation', { auditId });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
    });
    logger.info('PDF generated successfully', { filePath });
    return { filePath, fileName, fileSize: fs.statSync(filePath).size };
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDFReport };
