import {
  listActiveReminders,
  listRecurringReminders,
  listCompletedReminders,
  getReminderById,
  markReminderDone,
  snoozeReminder,
  deleteReminder
} from '../../services/reminder.service.js';
import { recordUserActivity } from '../../services/streak.service.js';
import {
  remindersListKeyboard,
  completedRemindersKeyboard,
  reminderItemKeyboard,
  remindersMenuKeyboard
} from '../keyboards/reminders.keyboard.js';
import { cancelKeyboard, backKeyboard } from '../keyboards/main.keyboard.js';
import { formatArabicDateTime } from '../../utils/timezone.js';

export function registerReminderHandlers(bot) {
  // Start add reminder flow
  bot.action('rem:add', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'reminder_add', step: 'title' });
    return ctx.editMessageText(
      '⏰ **إضافة تذكير جديد**\n\nأرسل عنوان التذكير (مثل: مراجعة التقرير، قراءة الورد، موعد الطبيب):',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    ).catch(() => ctx.reply('أرسل عنوان التذكير:', cancelKeyboard()));
  });

  // Recurrence selection step
  bot.action(/^rem_rec:(ONCE|DAILY|WEEKLY)$/, async (ctx) => {
    const recurrence = ctx.match[1];
    const session = ctx.userSession?.get();

    if (!session || session.flow !== 'reminder_add') {
      await ctx.answerCbQuery('انتهت صلاحية الجلسة.').catch(() => {});
      return ctx.editMessageText('انتهت الجلسة. يرجى البدء من جديد.', remindersMenuKeyboard());
    }

    session.recurrence = recurrence;
    session.step = 'time';
    ctx.userSession?.set(session);

    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(
      '⏰ **تحديد موعد التذكير:**\n\n' +
      `العنوان: **${session.title}**\n` +
      `التكرار: **${recurrence === 'DAILY' ? 'يوميًا' : recurrence === 'WEEKLY' ? 'أسبوعيًا' : 'مرة واحدة'}**\n\n` +
      'أرسل الوقت أو الموعد المراد، على سبيل المثال:\n' +
      '• `20:30` (الساعة الثامنة والنصف مساءً)\n' +
      '• `بعد ساعة` أو `بعد 30 دقيقة`\n' +
      '• `غدا 09:00`',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    );
  });

  // List active reminders
  bot.action('rem:list', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const reminders = await listActiveReminders(ctx.state.user.id);
    if (reminders.length === 0) {
      return ctx.editMessageText(
        '⏰ **قائمة التذكيرات**\n\nلا توجد تذكيرات نشطة حاليًا.',
        { parse_mode: 'Markdown', ...remindersMenuKeyboard() }
      );
    }

    let text = '⏰ **تذكيراتك النشطة:**\n\n';
    reminders.forEach((r, idx) => {
      const time = formatArabicDateTime(r.dueAt, ctx.state.user.timezone);
      const rec = r.recurrence === 'DAILY' ? ' (يومي)' : r.recurrence === 'WEEKLY' ? ' (أسبوعي)' : '';
      text += `${idx + 1}. **${r.title}**${rec}\n   📅 الموعد: ${time}\n\n`;
    });

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...remindersListKeyboard(reminders) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...remindersListKeyboard(reminders) }));
  });

  // List recurring reminders
  bot.action('rem:recurring', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const recurring = await listRecurringReminders(ctx.state.user.id);
    if (recurring.length === 0) {
      const text = '🔁 **التذكيرات المتكررة**\n\nلا توجد تذكيرات دورية (يومية أو أسبوعية) حاليًا.';
      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...backKeyboard('menu:reminders')
      });
    }

    let text = '🔁 **تذكيراتك المتكررة:**\n\n';
    recurring.forEach((r, idx) => {
      const time = formatArabicDateTime(r.dueAt, ctx.state.user.timezone);
      const rec = r.recurrence === 'DAILY' ? 'يوميًا' : 'أسبوعيًا';
      text += `${idx + 1}. **${r.title}** (${rec})\n   📅 الموعد القادم: ${time}\n\n`;
    });

    return ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...remindersListKeyboard(recurring, 'menu:reminders')
    }).catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...remindersListKeyboard(recurring, 'menu:reminders') }));
  });

  // List completed reminders
  bot.action('rem:completed', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const completed = await listCompletedReminders(ctx.state.user.id, 10);
    if (completed.length === 0) {
      const text = '✅ **التذكيرات المكتملة**\n\nلا توجد تذكيرات مكتملة مسجلة بعد.';
      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...backKeyboard('menu:reminders')
      });
    }

    let text = '✅ **أحدث التذكيرات المكتملة:**\n\n';
    completed.forEach((r, idx) => {
      const time = r.completedAt
        ? formatArabicDateTime(r.completedAt, ctx.state.user.timezone)
        : 'سابقًا';
      text += `${idx + 1}. **${r.title}** (أُنجز في ${time})\n`;
    });

    return ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...completedRemindersKeyboard(completed)
    }).catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...completedRemindersKeyboard(completed) }));
  });

  // View specific reminder
  bot.action(/^rem_view:(\d+)$/, async (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery().catch(() => {});

    const reminder = await getReminderById(id, ctx.state.user.id);
    if (!reminder) {
      return ctx.editMessageText('عذرًا، لم يتم العثور على التذكير.', remindersMenuKeyboard());
    }

    const time = formatArabicDateTime(reminder.dueAt, ctx.state.user.timezone);
    const rec = reminder.recurrence === 'DAILY' ? 'يوميًا' : reminder.recurrence === 'WEEKLY' ? 'أسبوعيًا' : 'مرة واحدة';
    const text = '⏰ **تفاصيل التذكير**\n\n' +
      `📌 العنوان: **${reminder.title}**\n` +
      `📅 الموعد: ${time}\n` +
      `🔄 التكرار: ${rec}\n` +
      `🟢 الحالة: ${reminder.active ? 'نشط' : 'مكتمل / غير نشط'}`;

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...reminderItemKeyboard(reminder.id) });
  });

  // Action: Mark Done
  bot.action(/^rem_act:done:(\d+)$/, async (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    await markReminderDone(id, ctx.state.user.id);
    await recordUserActivity(ctx.state.user.id, 'REMINDER_DONE', id, null, ctx.state.user.timezone);

    await ctx.answerCbQuery('✅ أحسنت! تم إنجاز التذكير وتحديث سلسلتك.').catch(() => {});
    return ctx.editMessageText('✅ **تم إنجاز التذكير بنجاح.**\nاستمر في التقدم 🌿', {
      parse_mode: 'Markdown',
      ...backKeyboard('rem:list')
    });
  });

  // Action: Snooze
  bot.action(/^rem_act:snooze:(\d+):(\d+)$/, async (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    const mins = parseInt(ctx.match[2], 10);
    await snoozeReminder(id, ctx.state.user.id, mins);

    await ctx.answerCbQuery(`⏰ تم تأجيل التذكير لمدة ${mins} دقيقة.`).catch(() => {});
    return ctx.editMessageText(`⏰ **تم تأجيل التذكير بنجاح.**\nسنذكرك بعد ${mins} دقيقة بإذن الله.`, {
      parse_mode: 'Markdown',
      ...backKeyboard('rem:list')
    });
  });

  // Action: Delete
  bot.action(/^rem_act:del:(\d+)$/, async (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    await deleteReminder(id, ctx.state.user.id);

    await ctx.answerCbQuery('🗑️ تم حذف التذكير.').catch(() => {});
    const reminders = await listActiveReminders(ctx.state.user.id);
    if (reminders.length === 0) {
      return ctx.editMessageText('تم حذف التذكير. لا توجد تذكيرات أخرى.', remindersMenuKeyboard());
    }
    return ctx.editMessageText('🗑️ **تم حذف التذكير بنجاح.**', {
      parse_mode: 'Markdown',
      ...remindersListKeyboard(reminders)
    });
  });
}
