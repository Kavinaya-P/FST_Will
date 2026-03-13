require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const path    = require('path');
const connectDB   = require('./config/db');
const { logger }  = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { startJobs }  = require('./jobs/scheduler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-setup-key'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);

// Static uploads (served without auth — filenames are UUIDs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── User routes ────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/vault',     require('./routes/vault'));
app.use('/api/nominees',  require('./routes/nominees'));
app.use('/api/deadman',   require('./routes/deadman'));
app.use('/api/death',     require('./routes/death'));      // Public nominee portal
app.use('/api/test',      require('./routes/test'));

// ── Admin routes (separate — uses admin JWT) ───────
app.use('/api/admin',     require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({
  success: true,
  message: 'Estate Vault API running',
  version: '3.0.0',
  timestamp: new Date().toISOString(),
}));

app.use('*', (req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  startJobs();
  app.listen(PORT, () => logger.info(`🔐 Estate Vault API v3 → http://localhost:${PORT}`));
};
start();
