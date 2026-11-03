// server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDatabase } = require('./src/config/database');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const logger = require('./src/config/logger');

const app = express();
const PORT = process.env.PORT || 4000;

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [process.env.NEXT_PUBLIC_API_URL, 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean),
  credentials: true,
}));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many requests' } }));
app.use('/api', rateLimit({ windowMs: 1 * 60 * 1000, max: 200 }));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// Serve PDF reports statically (development)
app.use('/reports', express.static(path.resolve(process.env.REPORTS_DIR || './reports')));

// API Routes
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.path} not found` }));

// Error handler
app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      logger.info(`SEO Dashboard API running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Mock mode: ${process.env.USE_MOCKS}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();
