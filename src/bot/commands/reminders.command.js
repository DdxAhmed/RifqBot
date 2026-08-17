import { listActiveReminders } from '../../services/reminder.service.js';
import { remindersMenuKeyboard } from '../keyboards/reminders.keyboard.js';

export function registerRemindersCommand(bot) {
  bot.command(['reminders', 'reminder', 'remind'], async (ctx) => {
    ctx.userSession?.clear();
    const active = await listActiveReminders(ctx.state.user.id);
    const count = active.length > 0
      ? `لديك (${active.length}) تذكير نشط حاليًا.`
      : 'لا توجد تذكيرات نشطة حاليًا.';

    const text = `⏰ **تذكيراتي**\n\n${count}\nاختر ما ترغب به من الخيارات أدناه:`;
    return ctx.reply(text, { parse_mode: 'Markdown', ...remindersMenuKeyboard() });
  });
}
