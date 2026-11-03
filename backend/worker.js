// worker.js — Standalone BullMQ worker process
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Worker } = require('bullmq');
const { getBullMQConnection } = require('./src/config/redis');
const { connectDatabase, prisma } = require('./src/config/database');
const { crawlWebsite } = require('./src/crawlers/websiteCrawler');
const { getPageSpeedData } = require('./src/services/pageSpeedService');
const { getGSCData } = require('./src/services/gscService');
const { getKeywordRankings } = require('./src/services/dataForSeoService');
const { analyzeSchema } = require('./src/services/schemaValidator');
const { analyzeOnPage } = require('./src/services/onPageAnalyzer');
const { analyzeTechnical } = require('./src/services/technicalSeoAnalyzer');
const { analyzeContent } = require('./src/services/contentAnalyzer');
const { analyzeSEO } = require('./src/ai/seoAnalyzer');
const { generatePDFReport } = require('./src/reports/pdfGenerator');
const { sendWhatsApp } = require('./src/mocks/twilio.mock');
const { sendReportEmail } = require('./src/notifications/emailService');
const { createNotification } = require('./src/notifications/notificationService');
const logger = require('./src/config/logger');

async function processAuditJob(job) {
  const { auditId, website } = job.data;
  logger.info('Processing audit job', { auditId, url: website.url });

  async function updateProgress(progress, status = 'ACTIVE') {
    await job.updateProgress(progress);
    await prisma.audit.update({ where: { id: auditId }, data: { progress, status } });
  }

  try {
    // Mark as active
    await prisma.audit.update({ where: { id: auditId }, data: { status: 'ACTIVE', startedAt: new Date() } });

    // Step 1: Initializing (5%)
    await updateProgress(5);
    logger.info('[1/12] Initializing audit', { auditId });

    // Step 2: Website Crawling (15%)
    await updateProgress(15);
    logger.info('[2/12] Crawling website', { url: website.url });
    const crawlData = await crawlWebsite(website.url);

    // Step 3: PageSpeed Analysis (25%)
    await updateProgress(25);
    logger.info('[3/12] PageSpeed analysis');
    const pageSpeedData = await getPageSpeedData(website.url);

    // Step 4: Search Console (35%)
    await updateProgress(35);
    logger.info('[4/12] Search Console analysis');
    const gscData = await getGSCData(website.url);

    // Step 5: Schema Validation (45%)
    await updateProgress(45);
    logger.info('[5/12] Schema validation');
    const schemaAnalysis = analyzeSchema(crawlData, website.businessType);

    // Step 6: On-Page Analysis (55%)
    await updateProgress(55);
    logger.info('[6/12] On-page analysis');
    const onPageAnalysis = analyzeOnPage(crawlData);

    // Step 7: Technical SEO (65%)
    await updateProgress(65);
    logger.info('[7/12] Technical SEO checks');
    const technicalAnalysis = analyzeTechnical(crawlData);

    // Step 7.5: Content SEO Analysis
    logger.info('[7.5/12] Content analysis');
    const contentAnalysis = analyzeContent(crawlData);

    // Step 8: Keyword Rankings (75%)
    await updateProgress(75);
    logger.info('[8/12] Keyword rankings');
    const primaryKeyword = website.targetKeywords?.[0] || `${website.businessType} ${website.city || ''}`.trim() || 'website';
    const rankingsData = await getKeywordRankings(new URL(website.url).hostname, primaryKeyword);

    // CWV data from PageSpeed & Crawler Latency
    const basePerfScore = Math.round((pageSpeedData.categories?.performance?.score || 0.65) * 100);
    // Factor in crawl response time
    const crawlResponseTime = crawlData.responseTime || 0;
    let latencyFactor = 0;
    if (crawlResponseTime > 0 && crawlResponseTime < 400) latencyFactor = 5;
    else if (crawlResponseTime > 1500) latencyFactor = -15;
    else if (crawlResponseTime > 800) latencyFactor = -5;

    const cwvScore = Math.max(10, Math.min(100, basePerfScore + latencyFactor));

    const cwvData = {
      lcp: pageSpeedData.audits?.['largest-contentful-paint'],
      cls: pageSpeedData.audits?.['cumulative-layout-shift'],
      inp: pageSpeedData.audits?.['interaction-to-next-paint'],
      renderBlocking: pageSpeedData.audits?.['render-blocking-resources'],
      unusedJs: pageSpeedData.audits?.['unused-javascript'],
      performanceScore: cwvScore,
      responseTime: crawlResponseTime,
    };

    // Calculate genuine weighted benchmark scores from real analyzers
    const technicalScore = technicalAnalysis.score;
    const onPageScore = onPageAnalysis.score;
    const contentScore = contentAnalysis.score;
    const schemaScore = schemaAnalysis.score;

    const overallScore = Math.max(0, Math.min(100, Math.round(
      (technicalScore * 0.25) +
      (onPageScore * 0.25) +
      (contentScore * 0.20) +
      (cwvScore * 0.15) +
      (schemaScore * 0.15)
    )));

    // Step 9: Claude AI Analysis (85%)
    await updateProgress(85);
    logger.info('[9/12] Claude AI analysis');
    const aiAnalysis = await analyzeSEO({
      url: website.url,
      businessType: website.businessType,
      city: website.city,
      state: website.state,
      onPageData: onPageAnalysis,
      technicalData: technicalAnalysis,
      contentData: contentAnalysis,
      cwvData,
      schemaData: schemaAnalysis,
      gscData,
      rankingsData,
      computedScores: {
        overallScore,
        technicalScore,
        onPageScore,
        contentScore,
        cwvScore,
        schemaScore,
      },
    });

    // Step 10: Persist to Database (90%)
    await updateProgress(90);
    logger.info('[10/12] Persisting audit results', { overallScore, technicalScore, onPageScore, contentScore, schemaScore });

    const auditResult = await prisma.auditResult.upsert({
      where: { auditId },
      create: {
        auditId,
        overallScore,
        technicalScore,
        onPageScore,
        contentScore,
        cwvScore,
        schemaScore,
        criticalIssues: aiAnalysis.critical_issues || [],
        importantIssues: aiAnalysis.important_issues || [],
        quickWins: aiAnalysis.quick_wins || [],
        recommendations: aiAnalysis.recommendations || [],
        executiveSummary: aiAnalysis.executive_summary || '',
        crawlData,
        pageSpeedData,
        gscData,
        schemaData: schemaAnalysis,
        technicalData: technicalAnalysis,
        rankingsData,
        rawAiResponse: aiAnalysis,
      },
      update: {
        overallScore,
        technicalScore,
        onPageScore,
        contentScore,
        cwvScore,
        schemaScore,
        criticalIssues: aiAnalysis.critical_issues || [],
        importantIssues: aiAnalysis.important_issues || [],
        quickWins: aiAnalysis.quick_wins || [],
        recommendations: aiAnalysis.recommendations || [],
        executiveSummary: aiAnalysis.executive_summary || '',
        crawlData,
        pageSpeedData,
        gscData,
        schemaData: schemaAnalysis,
        technicalData: technicalAnalysis,
        rankingsData,
        rawAiResponse: aiAnalysis,
      },
    });

    // Update website last audit
    await prisma.website.update({ where: { id: website.websiteId }, data: { lastAuditAt: new Date() } });

    // Step 11: PDF Generation (95%)
    await updateProgress(95);
    logger.info('[11/12] Generating PDF report');
    const { filePath, fileName, fileSize } = await generatePDFReport(website, {
      overallScore: auditResult.overallScore,
      technicalScore: auditResult.technicalScore,
      onPageScore: auditResult.onPageScore,
      contentScore: auditResult.contentScore,
      cwvScore: auditResult.cwvScore,
      schemaScore: auditResult.schemaScore,
      criticalIssues: auditResult.criticalIssues,
      importantIssues: auditResult.importantIssues,
      quickWins: auditResult.quickWins,
      recommendations: auditResult.recommendations,
      executiveSummary: auditResult.executiveSummary,
      pageSpeedData,
      gscData,
      rankingsData,
    }, auditId);

    const report = await prisma.report.create({
      data: { auditId, filePath, fileName, fileSize },
    });

    // Create PDF notification
    await createNotification({
      clientId: website.clientId,
      auditId,
      type: 'PDF_GENERATED',
      title: 'PDF Report Ready',
      message: `Your SEO audit report for ${website.name} is ready to download`,
    });

    // Step 12: Notifications (100%)
    await updateProgress(100);
    logger.info('[12/12] Sending notifications');

    // WhatsApp mock
    const whatsAppResult = await sendWhatsApp(website.clientId, filePath, auditResult.overallScore);
    await prisma.reportDelivery.create({
      data: { reportId: report.id, channel: 'whatsapp', status: whatsAppResult.status, sid: whatsAppResult.sid },
    });

    // Email (get client email)
    const client = await prisma.client.findUnique({ where: { id: website.clientId }, include: { user: true } });
    if (client) {
      const emailResult = await sendReportEmail(client.user.email, client.user.name, website.name, auditResult.overallScore, filePath);
      await prisma.reportDelivery.create({
        data: { reportId: report.id, channel: 'email', status: emailResult.status, sid: emailResult.messageId },
      });
    }

    // Mark audit completed
    await prisma.audit.update({ where: { id: auditId }, data: { status: 'COMPLETED', completedAt: new Date(), progress: 100 } });

    // Completion notification
    await createNotification({
      clientId: website.clientId,
      auditId,
      type: 'AUDIT_COMPLETED',
      title: 'Audit Completed',
      message: `SEO audit for ${website.name} completed with score ${auditResult.overallScore}/100`,
      metadata: { score: auditResult.overallScore, reportId: report.id },
    });

    logger.info('Audit job completed successfully', { auditId, score: auditResult.overallScore });
    return { auditId, score: auditResult.overallScore, reportId: report.id };

  } catch (error) {
    logger.error('Audit job failed', { auditId, error: error.message, stack: error.stack });

    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'FAILED', failedAt: new Date(), errorMessage: error.message },
    }).catch(() => {});

    await createNotification({
      clientId: job.data.website?.clientId,
      auditId,
      type: 'AUDIT_FAILED',
      title: 'Audit Failed',
      message: `SEO audit for ${job.data.website?.name} failed: ${error.message}`,
    }).catch(() => {});

    throw error;
  }
}

async function startWorker() {
  await connectDatabase();
  logger.info('Starting BullMQ worker for seo-audit-jobs');

  const worker = new Worker('seo-audit-jobs', processAuditJob, {
    connection: getBullMQConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job, result) => {
    logger.info('Job completed', { jobId: job.id, auditId: result?.auditId, score: result?.score });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message, attempts: job?.attemptsMade });
  });

  worker.on('progress', (job, progress) => {
    logger.debug('Job progress', { jobId: job.id, progress });
  });

  worker.on('error', (err) => {
    logger.error('Worker error', { error: err.message });
  });

  process.on('SIGTERM', async () => {
    logger.info('Worker shutting down...');
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  logger.info('Worker ready and listening for jobs');
}

startWorker().catch(err => {
  logger.error('Failed to start worker', { error: err.message });
  process.exit(1);
});
