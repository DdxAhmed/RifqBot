import { logger } from '../../utils/logger.js';
import { mainMenuKeyboard } from '../keyboards/main.keyboard.js';

export function errorHandler(error, ctx) {
  logger.error(`Unhandled bot error on update ${ctx?.update?.update_id || 'unknown'}:`, error);

  try {
    if (ctx.callbackQuery) {
      ctx.answerCbQuery('⚠️ حدث خطأ غير متوقع، يرجى المحاولة لاحقًا.').catch(() => {});
    }
    ctx.reply('⚠️ عذرًا، حدث خطأ غير متوقع أثناء معالجة طلبك. تم تسجيل الخطأ وسنعمل على حله.', mainMenuKeyboard()).catch(() => {});
  } catch (secondaryError) {
    logger.error('Failed to send error message to user:', secondaryError.message);
  }
}
