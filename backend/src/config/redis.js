// src/config/redis.js
const { Redis } = require('@upstash/redis');

let redis;

function getRedis() {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
      throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN are required');
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }
  return redis;
}

// BullMQ connection config (uses ioredis-compatible connection)
function getBullMQConnection() {
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    throw new Error('Redis credentials missing for BullMQ');
  }
  const url = new URL(process.env.UPSTASH_REDIS_URL);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6380,
    password: process.env.UPSTASH_REDIS_TOKEN,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
  };
}

module.exports = { getRedis, getBullMQConnection };
