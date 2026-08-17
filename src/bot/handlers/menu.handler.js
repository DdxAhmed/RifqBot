import {
  mainMenuKeyboard,
  quickAddKeyboard,
  dailyPlanKeyboard,
  progressKeyboard,
  helpMenuKeyboard,
  backKeyboard
} from '../keyboards/main.keyboard.js';
import { generateDailyPlan } from '../../services/plan.service.js';
import { getUserStatistics } from '../../services/statistics.service.js';
import { remindersMenuKeyboard } from '../keyboards/reminders.keyboard.js';
import { listActiveReminders } from '../../services/reminder.service.js';
import { coursesMenuKeyboard } from '../keyboards/courses.keyboard.js';
import { listUserCourses } from '../../services/course.service.js';
import { adhkarMenuKeyboard, adhkarSessionKeyboard } from '../keyboards/adhkar.keyboard.js';
import { getTodayAdhkarStatus, getAdhkarSessionState } from '../../services/adhkar.service.js';
import { goalsMenuKeyboard } from '../keyboards/goals.keyboard.js';
import { listTodayGoals } from '../../services/goals.service.js';
import { notesMenuKeyboard } from '../keyboards/notes.keyboard.js';
import { listNotes } from '../../services/notes.service.js';
import { settingsMenuKeyboard } from '../keyboards/settings.keyboard.js';
import { getUserSettings } from '../../services/settings.service.js';
import { formatDailyPlanMessage } from '../commands/plan.command.js';
import { formatProgressMessage } from '../commands/progress.command.js';
import { formatHelpMessage } from '../commands/help.command.js';

export function registerMenuHandlers(bot) {
  // Main Home Menu (supports both menu:home and nav:main)
  bot.action(['menu:home', 'nav:main'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.clear();
    const name = ctx.state.user.firstName ? ` يا ${ctx.state.user.firstName}` : '';
    const text = '🏠 **الرئيسية**\n\n' +
      `أهلًا بك في رِفْق${name} 👋\n` +
      'مساعدك لتنظيم يومك ومتابعة أهدافك والتعلّم والأذكار.\n\n' +
      'اختر من القائمة أدناه:';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainMenuKeyboard() })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...mainMenuKeyboard() }));
  });

  // Universal Quick-Add Menu
  bot.action('menu:add', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.clear();
    const text = '➕ **إضافة سريعة**\n\nماذا تريد أن تضيف الآن؟ 🌿';
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...quickAddKeyboard() })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...quickAddKeyboard() }));
  });

  // Cancel any active conversation flow
  bot.action('cancel_flow', async (ctx) => {
    await ctx.answerCbQuery('تم الإلغاء ✅').catch(() => {});
    ctx.userSession?.clear();
    return ctx.editMessageText('تم إلغاء العملية بنجاح. ما الذي ترغب في فعله الآن؟', {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard()
    }).catch(() => ctx.reply('تم الإلغاء.', mainMenuKeyboard()));
  });

  // Today's Plan (menu:plan and nav:today)
  bot.action(['menu:plan', 'nav:today'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const plan = await generateDailyPlan(ctx.state.user.id, ctx.state.user.timezone);
    const text = formatDailyPlanMessage(plan, ctx.state.user.timezone);

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...dailyPlanKeyboard() })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...dailyPlanKeyboard() }));
  });

  // Start Now (Intelligent plan action)
  bot.action('plan:start_now', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const plan = await generateDailyPlan(ctx.state.user.id, ctx.state.user.timezone);
    const hour = new Date().getHours();

    // 1. Morning Adhkar
    if (!plan.adhkar?.morningCompleted && hour < 14) {
      const state = getAdhkarSessionState('morning', 0);
      const text = `🌅 **أذكار الصباح** (1/${state.total})\n\n` +
        `«${state.currentItem.text}»\n\n` +
        `📖 **المصدر:** ${state.currentItem.reference}\n` +
        `🔢 **عدد التكرار المطلوب:** ${state.currentItem.count}`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...adhkarSessionKeyboard({
          kind: 'morning',
          index: 0,
          total: state.total,
          isFirst: true,
          isLast: state.isLast,
          currentCount: 0,
          targetCount: state.currentItem.count
        })
      }).catch(() => {});
    }

    // 2. Evening Adhkar
    if (!plan.adhkar?.eveningCompleted && hour >= 14) {
      const state = getAdhkarSessionState('evening', 0);
      const text = `🌙 **أذكار المساء** (1/${state.total})\n\n` +
        `«${state.currentItem.text}»\n\n` +
        `📖 **المصدر:** ${state.currentItem.reference}\n` +
        `🔢 **عدد التكرار المطلوب:** ${state.currentItem.count}`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...adhkarSessionKeyboard({
          kind: 'evening',
          index: 0,
          total: state.total,
          isFirst: true,
          isLast: state.isLast,
          currentCount: 0,
          targetCount: state.currentItem.count
        })
      }).catch(() => {});
    }

    // 3. Unfinished Goals
    const pendingGoal = plan.goals?.find((g) => !g.completed);
    if (pendingGoal) {
      const goals = await listTodayGoals(ctx.state.user.id, ctx.state.user.timezone);
      const text = `🎯 **هدف مقترح للبدء به الآن:**\n\n📌 **${pendingGoal.title}**\n\nاضغط على الزر أدناه لتحديده كمكتمل عند إنهائه:`;
      return ctx.editMessageText(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) })
        .catch(() => {});
    }

    // 4. Active Course
    const activeCourse = plan.courses?.find((c) => c.nextUnfinished);
    if (activeCourse) {
      const courses = await listUserCourses(ctx.state.user.id, ctx.state.user.timezone);
      const text = `📚 **الدرس التالي في مسارك التعليمي:**\n\nكورس: **${activeCourse.title}**\n▶️ الدرس: **${activeCourse.nextUnfinished.title}**\n\nتابع التعلّم من القائمة أدناه:`;
      return ctx.editMessageText(text, { parse_mode: 'Markdown', ...coursesMenuKeyboard(courses) })
        .catch(() => {});
    }

    // All clear celebration
    const allDoneText = '🎉 **ما شاء الله! خطتك لليوم مكتملة تمامًا!**\n\nواصل تميزك واستمر في هذا الأداء الرائع 🌿';
    return ctx.editMessageText(allDoneText, { parse_mode: 'Markdown', ...backKeyboard('menu:home') })
      .catch(() => ctx.reply(allDoneText, backKeyboard('menu:home')));
  });

  // Reminders menu
  bot.action(['menu:reminders', 'nav:reminders'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const active = await listActiveReminders(ctx.state.user.id);
    const countText = active.length > 0
      ? `لديك (${active.length}) تذكير نشط حاليًا.`
      : 'لا توجد تذكيرات نشطة حاليًا.';

    const text = `⏰ **تذكيراتي**\n\n${countText}\nاختر ما ترغب به من القائمة أدناه:`;
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...remindersMenuKeyboard() })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...remindersMenuKeyboard() }));
  });

  // Courses menu
  bot.action(['menu:courses', 'nav:courses'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const courses = await listUserCourses(ctx.state.user.id, ctx.state.user.timezone);
    const text = courses.length > 0
      ? '📚 **كورساتي ومسارات التعلّم:**\nاختر كورسًا لمتابعة الدروس أو أضف كورسًا جديدًا:'
      : '📚 **كورساتي**\n\nلم تقم بإضافة أي كورس بعد. يمكنك تنظيم تعلّمك بإضافة أول كورس الآن:';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...coursesMenuKeyboard(courses) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...coursesMenuKeyboard(courses) }));
  });

  // Adhkar menu
  bot.action(['menu:adhkar', 'nav:adhkar'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const todayStatus = await getTodayAdhkarStatus(ctx.state.user.id, ctx.state.user.timezone);
    const text = '🤲 **أذكاري اليومية**\n\n«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» 🌿\n\nاختر الجلسة التي ترغب في بدئها:';
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...adhkarMenuKeyboard(todayStatus) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...adhkarMenuKeyboard(todayStatus) }));
  });

  // Goals menu
  bot.action(['menu:goals', 'nav:goals'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const goals = await listTodayGoals(ctx.state.user.id, ctx.state.user.timezone);
    const text = goals.length > 0
      ? '🎯 **أهدافي:**\nاضغط على الهدف للتبديل بين مكتمل وغير مكتمل:'
      : '🎯 **أهدافي**\n\nلا توجد أهداف مسجلة لليوم. ابدأ بإضافة هدفك الأول:';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) }));
  });

  // Notes menu
  bot.action(['menu:notes', 'nav:notes'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const { notes, page, totalPages } = await listNotes(ctx.state.user.id, { page: 1, limit: 6 });
    const text = notes.length > 0
      ? '📝 **ملاحظاتي وأفكاري:**\nاضغط على أي ملاحظة لعرضها أو حذفها:'
      : '📝 **ملاحظاتي**\n\nلا توجد ملاحظات محفوظة بعد. اضغط أدناه لإضافة ملاحظة جديدة:';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...notesMenuKeyboard(notes, page, totalPages) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...notesMenuKeyboard(notes, page, totalPages) }));
  });

  // Stats / Progress menu
  bot.action(['menu:progress', 'nav:stats'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const s = await getUserStatistics(ctx.state.user.id);
    const text = formatProgressMessage(s);

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...progressKeyboard() })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...progressKeyboard() }));
  });

  // Settings menu
  bot.action(['menu:settings', 'nav:settings'], async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const settings = await getUserSettings(ctx.state.user.id);
    const text = '⚙️ **الإعدادات والتفضيلات**\n\n' +
      `المنطقة الزمنية الحالية: \`${ctx.state.user.timezone || 'Asia/Riyadh'}\`\n\n` +
      'تحكّم في خيارات التنبيهات والملخصات اليومية:';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...settingsMenuKeyboard(settings, ctx.state.user) })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...settingsMenuKeyboard(settings, ctx.state.user) }));
  });

  // Help menu
  bot.action('menu:help', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const text = formatHelpMessage();
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...helpMenuKeyboard() })
      .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...helpMenuKeyboard() }));
  });
}
