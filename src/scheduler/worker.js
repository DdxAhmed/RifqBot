import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../database/prisma.js';
import { processDueReminders } from './jobs/reminders.job.js';
import { processAdhkarNotifications } from './jobs/adhkar.job.js';
import { processDailySummaries } from './jobs/summary.job.js';
import { processStreakReminders } from './jobs/streak.job.js';
import { logger } from '../utils/logger.js';

const bot = new Telegraf(env.BOT_TOKEN);

async function runWorkerTicks() {
  try {
    await processDueReminders(bot);
  } catch (e) {
    logger.error('Reminders job error:', e.message);
  }
  try {
    await processAdhkarNotifications(bot);
  } catch (e) {
    logger.error('Adhkar job error:', e.message);
  }
  try {
    await processDailySummaries(bot);
  } catch (e) {
    logger.error('Summaries job error:', e.message);
  }
  try {
    await processStreakReminders(bot);
  } catch (e) {
    logger.error('Streak job error:', e.message);
  }
}

async function startWorker() {
  logger.info('Starting RIFQ Background Worker...');

  let connected = false;
  let attempts = 0;
  while (!connected && attempts < 10) {
    try {
      attempts++;
      await connectDatabase();
      connected = true;
    } catch (err) {
      logger.warn(`Worker DB connection attempt ${attempts} failed (${err.message}). Retrying in 5s...`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  if (!connected) {
    logger.error('Worker failed to connect to database after multiple attempts.');
    process.exit(1);
  }

  // Run every minute (UTC)
  const task = cron.schedule('* * * * *', () => {
    runWorkerTicks().catch((err) => logger.error('Scheduler tick error:', err.message));
  }, { timezone: 'UTC' });

  logger.info('RIFQ Background Worker started and listening for scheduled tasks.');

  // Immediate tick on startup to pick up any due reminders during restart
  runWorkerTicks().catch((err) => logger.error('Initial tick error:', err.message));

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Gracefully stopping worker...`);
    task.stop();
    await disconnectDatabase();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startWorker().catch((err) => {
  logger.error('Worker failed to start:', err);
  process.exit(1);
});
