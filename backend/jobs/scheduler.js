const cron = require('node-cron');
const { runDeadmanCheck } = require('../controllers/deadmanController');
const { logger } = require('../config/logger');

const startJobs = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('⏰ Running Dead Man\'s Switch check...');
    await runDeadmanCheck();
  });

  logger.info('✅ Cron jobs started — Dead Man\'s Switch checks daily at 9:00 AM');
};

module.exports = { startJobs };
