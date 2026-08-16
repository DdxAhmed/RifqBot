import { mainMenuKeyboard, backKeyboard } from '../keyboards/main.keyboard.js';
import { generateDailyPlan } from '../../services/plan.service.js';
import { getUserStatistics } from '../../services/statistics.service.js';
import { remindersMenuKeyboard } from '../keyboards/reminders.keyboard.js';
import { listActiveReminders } from '../../services/reminder.service.js';
import { coursesMenuKeyboard } from '../keyboards/courses.keyboard.js';
import { listUserCourses } from '../../services/course.service.js';
import { adhkarMenuKeyboard } from '../keyboards/adhkar.keyboard.js';
import { getTodayAdhkarStatus } from '../../services/adhkar.service.js';
import { goalsMenuKeyboard } from '../keyboards/goals.keyboard.js';
import { listTodayGoals } from '../../services/goals.service.js';
import { notesMenuKeyboard } from '../keyboards/notes.keyboard.js';
import { listNotes } from '../../services/notes.service.js';
import { settingsMenuKeyboard } from '../keyboards/settings.keyboard.js';
import { getUserSettings } from '../../services/settings.service.js';
import { formatArabicDateTime } from '../../utils/timezone.js';

export function registerMenuHandlers(bot) {
  // Main navigation action
  bot.action('nav:main', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.clear();
    const name = ctx.state.user.firstName ? ` يا ${ctx.state.user.firstName}` : '';
    return ctx.editMessageText(
      `أهلًا بك في رِفْق${name} 🌿\n\nمساعدك الشخصي للإنتاجية والتعلّم والأذكار دون ضغط.\nاختر من القائمة أدناه:`,
      mainMenuKeyboard()
    ).catch(() => ctx.reply(`أهلًا بك في رِفْق${name} 🌿`, mainMenuKeyboard()));
  });

  // Cancel flow
  bot.action('cancel_flow', async (ctx) => {
    await ctx.answerCbQuery('تم الإلغاء').catch(() => {});
    ctx.userSession?.clear();
    return ctx.editMessageText('تم إلغاء العملية بنجاح. ما الذي ترغب في فعله الآن؟', mainMenuKeyboard())
      .catch(() => ctx.reply('تم الإلغاء.', mainMenuKeyboard()));
  });

  // Today's Plan (خطتي اليوم)
  bot.action('nav:today', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const plan = await generateDailyPlan(ctx.state.user.id, ctx.state.user.timezone);

    let text = `📅 **خطتي اليوم** (${plan.dateFormatted})\n`;
    text += `🔥 السلسلة الحالية: ${plan.streak.current} يوم (أطول سلسلة: ${plan.streak.longest})\n\n`;

    // 1. Reminders
    text += '⏰ **تذكيرات اليوم:**\n';
    if (plan.reminders.length === 0) {
      text += '  ▫️ لا توجد تذكيرات مجدولة لليوم.\n';
    } else {
      plan.reminders.forEach((r) => {
        const timeStr = formatArabicDateTime(r.dueAt, ctx.state.user.timezone);
        text += `  • ${r.title} (${timeStr})\n`;
      });
    }

    // 2. Goals
    text += '\n🎯 **أهداف اليوم:**\n';
    if (plan.goals.length === 0) {
      text += '  ▫️ لم تحدد أهدافًا لليوم بعد.\n';
    } else {
      plan.goals.forEach((g) => {
        text += `  ${g.completed ? '✅' : '⬜'} ${g.title}\n`;
      });
    }

    // 3. Courses
    text += '\n📚 **متابعة الكورسات:**\n';
    if (plan.courses.length === 0) {
      text += '  ▫️ لا توجد كورسات نشطة حاليًا.\n';
    } else {
      plan.courses.forEach((c) => {
        text += `  • **${c.title}**: إنجاز ${c.completed}/${c.total} (${c.percent}%)\n`;
        if (c.pace) {
          text += `    📌 المعدل المطلوب: ${c.pace.requiredLessonsPerDay} درس/يوم (${c.pace.daysRemaining} يوم متبقي)\n`;
        }
        if (c.nextUnfinished) {
          text += `    ▶️ الدرس القادم: ${c.nextUnfinished.title}\n`;
        }
      });
    }

    // 4. Adhkar
    text += '\n🕌 **الأذكار:**\n';
    text += `  🌅 أذكار الصباح: ${plan.adhkar.morningCompleted ? '✅ أُنجزت' : '⏳ لم تُنجز بعد'}\n`;
    text += `  🌙 أذكار المساء: ${plan.adhkar.eveningCompleted ? '✅ أُنجزت' : '⏳ لم تُنجز بعد'}\n`;

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...backKeyboard('nav:main') })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...backKeyboard('nav:main') }));
  });

  // Reminders menu
  bot.action('nav:reminders', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const active = await listActiveReminders(ctx.state.user.id);
    const countText = active.length > 0 ? `لديك (${active.length}) تذكير نشط.` : 'لا توجد تذكيرات نشطة حاليًا.';
    return ctx.editMessageText(
      `⏰ **إدارة التذكيرات**\n\n${countText}\nيمكنك إضافة تذكير جديد أو استعراض القائمة:`,
      { parse_mode: 'Markdown', ...remindersMenuKeyboard() }
    ).catch(() => ctx.reply(`⏰ **إدارة التذكيرات**\n\n${countText}`, remindersMenuKeyboard()));
  });

  // Courses menu
  bot.action('nav:courses', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const courses = await listUserCourses(ctx.state.user.id, ctx.state.user.timezone);
    const text = courses.length > 0
      ? '📚 **كورساتك ومسارات تعلّمك:**\nاختر كورسًا لمتابعة الدروس أو أضف كورسًا جديدًا:'
      : '📚 **كورساتي**\n\nلم تقم بإضافة أي كورس بعد. يمكنك تنظيم تعلّمك بإضافة أول كورس الآن:';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...coursesMenuKeyboard(courses) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...coursesMenuKeyboard(courses) }));
  });

  // Adhkar menu
  bot.action('nav:adhkar', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const todayStatus = await getTodayAdhkarStatus(ctx.state.user.id, ctx.state.user.timezone);
    const text = '🕌 **الأذكار اليومية**\n\n«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»\n\nاختر الجلسة التي ترغب ببدئها:';
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...adhkarMenuKeyboard(todayStatus) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...adhkarMenuKeyboard(todayStatus) }));
  });

  // Goals menu
  bot.action('nav:goals', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const goals = await listTodayGoals(ctx.state.user.id, ctx.state.user.timezone);
    const text = goals.length > 0
      ? '🎯 **أهداف اليوم:**\nاضغط على الهدف للتبديل بين مكتمل وغير مكتمل:'
      : '🎯 **أهدافي اليومية**\n\nلا توجد أهداف مسجلة لليوم. ابدأ بإضافة هدفك الأول:';
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) }));
  });

  // Notes menu
  bot.action('nav:notes', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const { notes, page, totalPages } = await listNotes(ctx.state.user.id, { page: 1, limit: 6 });
    const text = notes.length > 0
      ? '📝 **ملاحظاتك وأفكارك:**\nاضغط على أي ملاحظة لعرضها أو حذفها:'
      : '📝 **ملاحظاتي**\n\nلا توجد ملاحظات محفوظة بعد. اضغط أدناه لإضافة ملاحظة سريعة:';
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...notesMenuKeyboard(notes, page, totalPages) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...notesMenuKeyboard(notes, page, totalPages) }));
  });

  // Stats menu
  bot.action('nav:stats', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const s = await getUserStatistics(ctx.state.user.id);
    const text = '📊 **إحصائياتك وإنجازاتك** 🌿\n\n' +
      `🔥 **السلسلة الحالية:** ${s.currentStreak} يوم\n` +
      `🏆 **أطول سلسلة:** ${s.longestStreak} يوم\n\n` +
      `✅ **التذكيرات المنجزة:** ${s.completedReminders}\n` +
      `📚 **الدروس المكتملة:** ${s.completedLessons}\n` +
      `🎯 **الأهداف المحققة:** ${s.completedGoals}\n` +
      `🕌 **جلسات الأذكار المكتملة:** ${s.completedAdhkar}\n\n` +
      `⚡ **نشاط آخر 7 أيام:** ${s.activity7d} عملية\n` +
      `📈 **نشاط آخر 30 يومًا:** ${s.activity30d} عملية`;

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...backKeyboard('nav:main') })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...backKeyboard('nav:main') }));
  });

  // Settings menu
  bot.action('nav:settings', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const settings = await getUserSettings(ctx.state.user.id);
    const text = '⚙️ **الإعدادات والتفضيلات**\n\n' +
      `المنطقة الزمنية الحالية: \`${ctx.state.user.timezone || 'Asia/Riyadh'}\`\n\n` +
      'تحكّم في خيارات التنبيهات والملخصات اليومية:';
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...settingsMenuKeyboard(settings, ctx.state.user) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...settingsMenuKeyboard(settings, ctx.state.user) }));
  });
}
