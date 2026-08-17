import { generateDailyPlan } from '../../services/plan.service.js';
import { formatArabicDateTime } from '../../utils/timezone.js';
import { dailyPlanKeyboard } from '../keyboards/main.keyboard.js';

export function formatDailyPlanMessage(plan, timezone) {
  let text = `📅 **خطتك اليوم** (${plan.dateFormatted})\n`;
  text += `🔥 **السلسلة الحالية:** ${plan.streak.current} يوم\n\n`;

  // 1. Courses
  text += '📚 **الكورسات:**\n';
  if (!plan.courses || plan.courses.length === 0) {
    text += '  ▫️ لا توجد كورسات نشطة حاليًا.\n';
  } else {
    plan.courses.forEach((c) => {
      text += `  • **${c.title}**: ${c.completed}/${c.total} (${c.percent}%)\n`;
      if (c.nextUnfinished) {
        text += `    ▶️ الدرس القادم: ${c.nextUnfinished.title}\n`;
      }
      if (c.pace) {
        text += `    📌 المعدل: ${c.pace.requiredLessonsPerDay} درس/يوم (${c.pace.daysRemaining} يوم متبقي)\n`;
      }
    });
  }

  // 2. Goals
  text += '\n🎯 **أهداف اليوم:**\n';
  if (!plan.goals || plan.goals.length === 0) {
    text += '  ▫️ لا توجد أهداف مسجلة اليوم.\n';
  } else {
    plan.goals.forEach((g) => {
      text += `  ${g.completed ? '✅' : '⬜'} ${g.title}\n`;
    });
  }

  // 3. Reminders
  text += '\n⏰ **التذكيرات:**\n';
  if (!plan.reminders || plan.reminders.length === 0) {
    text += '  ▫️ لا توجد تذكيرات مجدولة اليوم.\n';
  } else {
    plan.reminders.forEach((r) => {
      const timeStr = formatArabicDateTime(r.dueAt, timezone);
      text += `  • ${r.title} (${timeStr})\n`;
    });
  }

  // 4. Adhkar
  text += '\n🤲 **الأذكار:**\n';
  text += `  🌅 الصباح: ${plan.adhkar?.morningCompleted ? '✅ أُنجزت' : '⏳ متبقية'}\n`;
  text += `  🌙 المساء: ${plan.adhkar?.eveningCompleted ? '✅ أُنجزت' : '⏳ متبقية'}`;

  return text;
}

export function registerPlanCommand(bot) {
  bot.command(['plan', 'today'], async (ctx) => {
    ctx.userSession?.clear();
    const plan = await generateDailyPlan(ctx.state.user.id, ctx.state.user.timezone);
    const text = formatDailyPlanMessage(plan, ctx.state.user.timezone);
    return ctx.reply(text, { parse_mode: 'Markdown', ...dailyPlanKeyboard() });
  });
}
