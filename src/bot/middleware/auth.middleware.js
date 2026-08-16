import { upsertUser } from '../../services/user.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export async function authMiddleware(ctx, next) {
  if (!ctx.from) {
    return next();
  }

  try {
    const user = await upsertUser(ctx.from);

    if (user.isBanned) {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery('عذرًا، حسابك محظور من استخدام البوت.', { show_alert: true });
      }
      return ctx.reply('🚫 عذرًا، حسابك محظور من استخدام البوت. يرجى التواصل مع الإدارة.');
    }

    ctx.state.user = user;
    ctx.state.isAdmin = env.isAdmin(ctx.from.id);
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
  }

  return next();
}
