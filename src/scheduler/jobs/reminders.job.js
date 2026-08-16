import {
  fetchDueReminders,
  claimReminder,
  completeOrAdvanceReminder
} from '../../services/reminder.service.js';
import { reminderAlertKeyboard } from '../../bot/keyboards/reminders.keyboard.js';
import { logger } from '../../utils/logger.js';

const executionLocks = new Set();

export async function processDueReminders(bot) {
  try {
    const dueList = await fetchDueReminders(new Date(), 50);

    for (const reminder of dueList) {
      if (executionLocks.has(reminder.id)) {
        continue;
      }

      executionLocks.add(reminder.id);

      try {
        const claimed = await claimReminder(reminder.id);
        if (!claimed) {
          continue;
        }

        const telegramId = Number(reminder.user.telegramId);
        const alertText = `⏰ **حان موعد التذكير!**\n\n📌 **${reminder.title}**` +
          (reminder.description ? `\n\n_${reminder.description}_` : '');

        await bot.telegram.sendMessage(telegramId, alertText, {
          parse_mode: 'Markdown',
          ...reminderAlertKeyboard(reminder.id)
        });

        await completeOrAdvanceReminder(reminder);
        logger.info(`Reminder executed successfully id=${reminder.id} user=${reminder.userId}`);
      } catch (err) {
        logger.error(`Error executing reminder id=${reminder.id}:`, err.message);
      } finally {
        executionLocks.delete(reminder.id);
      }
    }
  } catch (error) {
    logger.error('Error in processDueReminders job:', error.message);
  }
}
