import 'dotenv/config';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Detect test runner or absence of required env vars in non-production
const isTestEnv = process.env.NODE_ENV === 'test' ||
  !process.env.BOT_TOKEN ||
  process.argv.some(arg => arg.includes('test'));

const schema = z.object({
  BOT_TOKEN: z.string().min(10, 'BOT_TOKEN must be provided'),
  DATABASE_URL: z.string().min(5, 'DATABASE_URL must be provided'),
  DIRECT_URL: z.string().optional(),
  ADMIN_TELEGRAM_IDS: z.string().default(''),
  PRAYER_API_URL: z.string().url().optional().or(z.literal('')),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

const defaultTestToken = '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz';
const defaultTestDbUrl = 'postgresql://rifq:password@localhost:5432/rifq?schema=public';

const rawEnv = {
  BOT_TOKEN: process.env.BOT_TOKEN || (isTestEnv ? defaultTestToken : undefined),
  DATABASE_URL: process.env.DATABASE_URL || (isTestEnv ? defaultTestDbUrl : undefined),
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || (isTestEnv ? defaultTestDbUrl : undefined),
  ADMIN_TELEGRAM_IDS: process.env.ADMIN_TELEGRAM_IDS || '',
  PRAYER_API_URL: process.env.PRAYER_API_URL || '',
  NODE_ENV: process.env.NODE_ENV || (isTestEnv ? 'test' : 'production'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

const parsed = schema.safeParse(rawEnv);

if (!parsed.success) {
  logger.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  if (!isTestEnv) {
    process.exit(1);
  }
}

const data = parsed.success ? parsed.data : {
  BOT_TOKEN: defaultTestToken,
  DATABASE_URL: defaultTestDbUrl,
  ADMIN_TELEGRAM_IDS: '',
  PRAYER_API_URL: '',
  NODE_ENV: 'test',
  LOG_LEVEL: 'info'
};

const adminIds = new Set(
  (data.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => {
      try {
        return BigInt(id);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
);

export const env = {
  ...data,
  adminIds,
  isAdmin(telegramId) {
    if (!telegramId) return false;
    try {
      return adminIds.has(BigInt(telegramId));
    } catch {
      return false;
    }
  }
};
