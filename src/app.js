import { Telegraf } from 'telegraf';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './database/prisma.js';
import { authMiddleware } from './bot/middleware/auth.middleware.js';
import { sessionMiddleware } from './bot/middleware/session.middleware.js';
import { errorHandler } from './bot/middleware/error.middleware.js';
import { registerCommands } from './bot/commands/index.js';
import { registerAllHandlers } from './bot/handlers/index.js';
import { logger } from './utils/logger.js';

export function createBot() {
  const bot = new Telegraf(env.BOT_TOKEN);

  // 1. Middlewares
  bot.use(sessionMiddleware());
  bot.use(authMiddleware);

  // 2. Commands
  registerCommands(bot);

  // 3. Callback and Text Handlers
  registerAllHandlers(bot);

  // 4. Global error handler
  bot.catch(errorHandler);

  return bot;
}

async function startBot() {
  logger.info('Starting RIFQ Telegram Bot...');
  await connectDatabase();

  const bot = createBot();

  let started = false;
  let attempts = 0;
  while (!started && attempts < 10) {
    try {
      attempts++;
      await bot.launch();
      started = true;
      logger.info('RIFQ Telegram Bot is running and ready for messages.');
    } catch (err) {
      logger.warn(`Bot launch attempt ${attempts} failed (${err.message}). Retrying in 5s...`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  if (!started) {
    logger.error('Failed to start Telegram bot after multiple attempts.');
    process.exit(1);
  }

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Gracefully stopping bot...`);
    bot.stop(signal);
    await disconnectDatabase();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

// Only launch automatically if executed directly (not imported in tests)
if (process.env.NODE_ENV !== 'test') {
  startBot().catch((err) => {
    logger.error('Bot failed to start:', err);
    process.exit(1);
  });
}
