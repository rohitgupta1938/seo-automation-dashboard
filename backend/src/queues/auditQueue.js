// src/queues/auditQueue.js
const { Queue } = require('bullmq');
const { getBullMQConnection } = require('../config/redis');
const logger = require('../config/logger');

let auditQueue;

function getAuditQueue() {
  if (!auditQueue) {
    auditQueue = new Queue('seo-audit-jobs', {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    logger.info('Audit queue initialized');
  }
  return auditQueue;
}

async function enqueueAudit(auditId, websiteData) {
  const queue = getAuditQueue();
  const job = await queue.add(
    'process-audit',
    { auditId, website: websiteData },
    { jobId: auditId }
  );
  logger.info('Audit job enqueued', { auditId, jobId: job.id });
  return job;
}

async function getJobStatus(jobId) {
  const queue = getAuditQueue();
  const job = await queue.getJob(jobId);
  if (!job) return null;
  const state = await job.getState();
  return { id: job.id, state, progress: job.progress, data: job.data, returnvalue: job.returnvalue, failedReason: job.failedReason };
}

module.exports = { getAuditQueue, enqueueAudit, getJobStatus };
