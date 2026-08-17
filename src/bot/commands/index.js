import { registerStartCommand } from './start.command.js';
import { registerPlanCommand } from './plan.command.js';
import { registerRemindersCommand } from './reminders.command.js';
import { registerCoursesCommand } from './courses.command.js';
import { registerGoalsCommand } from './goals.command.js';
import { registerNotesCommand } from './notes.command.js';
import { registerAdhkarCommand } from './adhkar.command.js';
import { registerProgressCommand } from './progress.command.js';
import { registerSettingsCommand } from './settings.command.js';
import { registerHelpCommand } from './help.command.js';
import { registerAdminCommands } from './admin.command.js';
import { logger } from '../../utils/logger.js';

export const BOT_COMMANDS_LIST = [
  { command: 'start', description: '🏠 الرئيسية' },
  { command: 'plan', description: '📅 خطتي اليوم' },
  { command: 'reminders', description: '⏰ تذكيراتي' },
  { command: 'courses', description: '📚 كورساتي' },
  { command: 'goals', description: '🎯 أهدافي' },
  { command: 'notes', description: '📝 ملاحظاتي' },
  { command: 'adhkar', description: '🤲 أذكاري' },
  { command: 'progress', description: '📊 تقدمي' },
  { command: 'settings', description: '⚙️ الإعدادات' },
  { command: 'help', description: '❓ المساعدة' }
];

export async function setupBotCommands(bot) {
  try {
    if (bot.telegram?.setMyCommands) {
      await bot.telegram.setMyCommands(BOT_COMMANDS_LIST);
      logger.info('Telegram Bot Command Menu successfully configured.');
    }
  } catch (err) {
    logger.warn('Failed to set Telegram bot commands menu:', err.message);
  }
}

export function registerCommands(bot) {
  registerStartCommand(bot);
  registerPlanCommand(bot);
  registerRemindersCommand(bot);
  registerCoursesCommand(bot);
  registerGoalsCommand(bot);
  registerNotesCommand(bot);
  registerAdhkarCommand(bot);
  registerProgressCommand(bot);
  registerSettingsCommand(bot);
  registerHelpCommand(bot);
  registerAdminCommands(bot);
}
