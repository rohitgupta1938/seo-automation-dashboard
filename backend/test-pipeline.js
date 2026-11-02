// test-pipeline.js — Tests the complete audit pipeline without Redis/DB
require('dotenv').config();

const { crawlWebsite } = require('./src/crawlers/websiteCrawler');
const { getPageSpeedData } = require('./src/services/pageSpeedService');
const { getGSCData } = require('./src/services/gscService');
const { getKeywordRankings } = require('./src/services/dataForSeoService');
const { analyzeSchema } = require('./src/services/schemaValidator');
const { analyzeOnPage } = require('./src/services/onPageAnalyzer');
const { analyzeTechnical } = require('./src/services/technicalSeoAnalyzer');
const { analyzeSEO } = require('./src/ai/seoAnalyzer');
const { sendWhatsApp } = require('./src/mocks/twilio.mock');

// Override USE_MOCKS for test
process.env.USE_MOCKS = 'true';

async function testPipeline() {
  console.log('\n🚀 Testing Complete Audit Pipeline (Mock Mode)\n');
  console.log('='.repeat(60));

  const testUrl = 'https://example.com';
  const websiteData = {
    url: testUrl,
    name: 'Example Dental Clinic',
    businessType: 'Dental Clinic',
    city: 'Pune',
    state: 'Maharashtra',
    targetKeywords: ['dental clinic pune'],
    clientId: 'test-client-id',
  };

  try {
    // Step 1: Crawl
    console.log('\n[1] Crawling website...');
    const crawlData = await crawlWebsite(testUrl);
    console.log(`  ✅ Crawled ${crawlData.totalPagesCrawled} page(s)`);
    console.log(`  - HTTP: ${crawlData.httpStatus} | HTTPS: ${crawlData.isHttps}`);
    console.log(`  - robots.txt: ${crawlData.robotsTxt.exists ? 'Found' : 'Not found'}`);
    console.log(`  - sitemap.xml: ${crawlData.sitemapXml.exists ? 'Found' : 'Not found'}`);
    if (crawlData.mainPage?.title) console.log(`  - Title: "${crawlData.mainPage.title}"`);

    // Step 2: PageSpeed
    console.log('\n[2] PageSpeed analysis (MOCK)...');
    const psData = await getPageSpeedData(testUrl);
    console.log(`  ✅ Performance: ${Math.round(psData.categories.performance.score * 100)}`);
    console.log(`  - LCP: ${psData.audits['largest-contentful-paint'].displayValue}`);
    console.log(`  - CLS: ${psData.audits['cumulative-layout-shift'].displayValue}`);

    // Step 3: GSC
    console.log('\n[3] Google Search Console (MOCK)...');
    const gscData = await getGSCData(testUrl);
    console.log(`  ✅ Total clicks: ${gscData.totalClicks}, Impressions: ${gscData.totalImpressions}`);
    console.log(`  - Top query: "${gscData.rows[0].query}"`);

    // Step 4: Schema
    console.log('\n[4] Schema.org validation...');
    const schemaAnalysis = analyzeSchema(crawlData);
    console.log(`  ✅ Schema score: ${schemaAnalysis.score}`);
    console.log(`  - Has structured data: ${schemaAnalysis.hasStructuredData}`);

    // Step 5: On-Page
    console.log('\n[5] On-page analysis...');
    const onPageAnalysis = analyzeOnPage(crawlData);
    console.log(`  ✅ On-page score: ${onPageAnalysis.score}`);
    console.log(`  - Issues: ${onPageAnalysis.issues.length}, Warnings: ${onPageAnalysis.warnings.length}`);

    // Step 6: Technical
    console.log('\n[6] Technical SEO analysis...');
    const technicalAnalysis = analyzeTechnical(crawlData);
    console.log(`  ✅ Technical score: ${technicalAnalysis.score}`);

    // Step 7: DataForSEO
    console.log('\n[7] Keyword rankings (MOCK)...');
    const rankingsData = await getKeywordRankings('example-dental-clinic.com', 'dental clinic pune');
    console.log(`  ✅ Client rank position: #${rankingsData.client_rank_position}`);
    console.log(`  - Search volume: ${rankingsData.keyword_search_volume}/mo`);

    // Step 8: CWV
    const cwvData = {
      lcp: psData.audits['largest-contentful-paint'],
      cls: psData.audits['cumulative-layout-shift'],
      inp: psData.audits['interaction-to-next-paint'],
      performanceScore: Math.round(psData.categories.performance.score * 100),
    };

    // Step 9: Claude AI
    console.log('\n[8] Claude AI analysis (MOCK — no API key)...');
    const aiAnalysis = await analyzeSEO({
      url: testUrl,
      businessType: websiteData.businessType,
      city: websiteData.city,
      state: websiteData.state,
      onPageData: onPageAnalysis,
      technicalData: technicalAnalysis,
      cwvData,
      schemaData: schemaAnalysis,
      gscData,
      rankingsData,
    });
    console.log(`  ✅ Overall SEO score: ${aiAnalysis.overall_score}/100`);
    console.log(`  - Critical issues: ${aiAnalysis.critical_issues.length}`);
    console.log(`  - Important issues: ${aiAnalysis.important_issues.length}`);
    console.log(`  - Quick wins: ${aiAnalysis.quick_wins.length}`);
    console.log(`  - Recommendations: ${aiAnalysis.recommendations.length}`);
    console.log(`  - Scores: Tech=${aiAnalysis.score_breakdown.technical}, OnPage=${aiAnalysis.score_breakdown.on_page}, CWV=${aiAnalysis.score_breakdown.core_web_vitals}`);

    // Step 10: WhatsApp mock
    console.log('\n[9] WhatsApp notification (MOCK)...');
    const whatsAppResult = await sendWhatsApp('test-client-id', './reports/test-report.pdf', aiAnalysis.overall_score);
    console.log(`  ✅ WhatsApp status: ${whatsAppResult.status}`);
    console.log(`  - SID: ${whatsAppResult.sid}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL PIPELINE STEPS PASSED');
    console.log(`📊 Final SEO Score: ${aiAnalysis.overall_score}/100`);
    console.log('='.repeat(60) + '\n');

    return true;

  } catch (error) {
    console.error('\n❌ Pipeline test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

testPipeline().then(ok => process.exit(ok ? 0 : 1));
