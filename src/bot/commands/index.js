import { mainMenuKeyboard } from '../keyboards/main.keyboard.js';
import { generateDailyPlan } from '../../services/plan.service.js';
import { listActiveReminders } from '../../services/reminder.service.js';
import { listUserCourses } from '../../services/course.service.js';
import { getTodayAdhkarStatus } from '../../services/adhkar.service.js';
import { listTodayGoals, addGoal } from '../../services/goals.service.js';
import { addNote, listNotes } from '../../services/notes.service.js';
import { getUserStatistics } from '../../services/statistics.service.js';
import { getUserSettings } from '../../services/settings.service.js';
import { getAdminDashboardStats, isUserAdmin } from '../../admin/services/admin.service.js';
import { checkHealth } from '../../utils/health.js';
import { formatArabicDateTime } from '../../utils/timezone.js';
import { sanitizeText } from '../../utils/validation.js';
import { remindersMenuKeyboard } from '../keyboards/reminders.keyboard.js';
import { coursesMenuKeyboard } from '../keyboards/courses.keyboard.js';
import { adhkarMenuKeyboard } from '../keyboards/adhkar.keyboard.js';
import { goalsMenuKeyboard } from '../keyboards/goals.keyboard.js';
import { notesMenuKeyboard } from '../keyboards/notes.keyboard.js';
import { settingsMenuKeyboard } from '../keyboards/settings.keyboard.js';
import { adminDashboardKeyboard } from '../keyboards/admin.keyboard.js';

export function registerCommands(bot) {
  // /start
  bot.start(async (ctx) => {
    ctx.userSession?.clear();
    const name = ctx.from?.first_name ? ` يا ${ctx.from.first_name}` : '';
    const welcome = `أهلًا بك في رِفْق${name} 🌿\n\n` +
      'مساعدك الشخصي لإدارة يومك والتعلّم والأذكار براحة ودون تشتت.\n\n' +
      '📌 اختر من القائمة الرئيسية أدناه أو اكتب /help لمعرفة الأوامر المتاحة:';
    return ctx.reply(welcome, mainMenuKeyboard());
  });

  // /help, /menu
  bot.command(['help', 'menu'], async (ctx) => {
    ctx.userSession?.clear();
    const helpText = '🌿 **أوامر رِفْق السريعة:**\n\n' +
      '📅 /today - عرض خطتك اليومية المتكاملة\n' +
      '⏰ /reminders - قائمة التذكيرات وإدارتها\n' +
      '📚 /courses - متابعة الكورسات والدروس\n' +
      '🕌 /adhkar - جلسات أذكار الصباح والمساء\n' +
      '🎯 /goals - أهدافك لليوم\n' +
      '📝 /note [نص] - حفظ ملاحظة فورية\n' +
      '📝 /notes - استعراض ملاحظاتك\n' +
      '📊 /stats - إحصائياتك وسلسلة إنجازك\n' +
      '⚙️ /settings - ضبط الإعدادات والمنطقة الزمنية';
    return ctx.reply(helpText, { parse_mode: 'Markdown', ...mainMenuKeyboard() });
  });

  // /today
  bot.command('today', async (ctx) => {
    const plan = await generateDailyPlan(ctx.state.user.id, ctx.state.user.timezone);
    let text = `📅 **خطتي اليوم** (${plan.dateFormatted})\n\n`;

    text += '⏰ **التذكيرات:**\n';
    if (plan.reminders.length === 0) text += '  ▫️ لا توجد تذكيرات اليوم.\n';
    else plan.reminders.forEach((r) => { text += `  • ${r.title} (${formatArabicDateTime(r.dueAt, ctx.state.user.timezone)})\n`; });

    text += '\n🎯 **الأهداف:**\n';
    if (plan.goals.length === 0) text += '  ▫️ لا توجد أهداف مسجلة اليوم.\n';
    else plan.goals.forEach((g) => { text += `  ${g.completed ? '✅' : '⬜'} ${g.title}\n`; });

    text += '\n🕌 **الأذكار:**\n';
    text += `  🌅 الصباح: ${plan.adhkar.morningCompleted ? '✅ أُنجزت' : '⏳ متبقية'}\n`;
    text += `  🌙 المساء: ${plan.adhkar.eveningCompleted ? '✅ أُنجزت' : '⏳ متبقية'}\n`;

    return ctx.reply(text, { parse_mode: 'Markdown', ...mainMenuKeyboard() });
  });

  // /reminders, /reminder, /remind
  bot.command(['reminders', 'reminder', 'remind'], async (ctx) => {
    const active = await listActiveReminders(ctx.state.user.id);
    const count = active.length > 0 ? `لديك (${active.length}) تذكير نشط.` : 'لا توجد تذكيرات نشطة.';
    return ctx.reply(`⏰ **التذكيرات**\n\n${count}`, { parse_mode: 'Markdown', ...remindersMenuKeyboard() });
  });

  // /courses, /course
  bot.command(['courses', 'course'], async (ctx) => {
    const courses = await listUserCourses(ctx.state.user.id, ctx.state.user.timezone);
    return ctx.reply('📚 **كورساتك ومسارات تعلّمك:**', coursesMenuKeyboard(courses));
  });

  // /adhkar, /azkar
  bot.command(['adhkar', 'azkar'], async (ctx) => {
    const todayStatus = await getTodayAdhkarStatus(ctx.state.user.id, ctx.state.user.timezone);
    return ctx.reply('🕌 **الأذكار اليومية**', adhkarMenuKeyboard(todayStatus));
  });

  // /goals, /goal
  bot.command(['goals', 'goal'], async (ctx) => {
    const rawArg = ctx.message.text.replace(/^\/goals?(\s+|$)/i, '').trim();
    if (rawArg) {
      await addGoal(ctx.state.user.id, sanitizeText(rawArg, 200), ctx.state.user.timezone);
      return ctx.reply(`✅ تمت إضافة الهدف: "${rawArg}"`, mainMenuKeyboard());
    }
    const goals = await listTodayGoals(ctx.state.user.id, ctx.state.user.timezone);
    return ctx.reply('🎯 **أهداف اليوم:**', goalsMenuKeyboard(goals));
  });

  // /note
  bot.command('note', async (ctx) => {
    const content = ctx.message.text.replace(/^\/note\s*/i, '').trim();
    if (!content) {
      ctx.userSession?.set({ flow: 'note_add' });
      return ctx.reply('📝 أرسل نص الملاحظة الآن:');
    }
    await addNote(ctx.state.user.id, sanitizeText(content, 2000));
    return ctx.reply('✅ **حُفظت الملاحظة بنجاح.**', mainMenuKeyboard());
  });

  // /notes
  bot.command('notes', async (ctx) => {
    const { notes, page, totalPages } = await listNotes(ctx.state.user.id, { page: 1, limit: 6 });
    return ctx.reply('📝 **ملاحظاتك:**', notesMenuKeyboard(notes, page, totalPages));
  });

  // /stats
  bot.command('stats', async (ctx) => {
    const s = await getUserStatistics(ctx.state.user.id);
    const text = '📊 **إحصائياتك** 🌿\n\n' +
      `🔥 السلسلة الحالية: ${s.currentStreak} يوم\n` +
      `🏆 أطول سلسلة: ${s.longestStreak} يوم\n` +
      `✅ التذكيرات المكتملة: ${s.completedReminders}\n` +
      `📚 الدروس المكتملة: ${s.completedLessons}\n` +
      `🎯 الأهداف المحققة: ${s.completedGoals}\n` +
      `🕌 جلسات الأذكار: ${s.completedAdhkar}`;
    return ctx.reply(text, mainMenuKeyboard());
  });

  // /settings
  bot.command('settings', async (ctx) => {
    const settings = await getUserSettings(ctx.state.user.id);
    return ctx.reply('⚙️ **الإعدادات والتفضيلات:**', settingsMenuKeyboard(settings, ctx.state.user));
  });

  // /admin
  bot.command('admin', async (ctx) => {
    if (!isUserAdmin(ctx.from.id)) {
      return ctx.reply('⛔ هذا الأمر مخصص لإدارة البوت فقط.');
    }
    const stats = await getAdminDashboardStats();
    const text = '👑 **لوحة تحكم الإدارة - رِفْق**\n\n' +
      `👥 إجمالي المستخدمين: **${stats.totalUsers}**\n` +
      `⚡ المستخدمين النشطين (24 ساعة): **${stats.activeUsers24hCount}**\n` +
      `🚫 المستخدمين المحظورين: **${stats.bannedUsers}**\n` +
      `⏰ التذكيرات النشطة: **${stats.activeReminders}**\n` +
      `📚 إجمالي الكورسات: **${stats.totalCourses}**\n` +
      `🎯 إجمالي الأهداف: **${stats.totalDailyGoals}**`;
    return ctx.reply(text, { parse_mode: 'Markdown', ...adminDashboardKeyboard() });
  });

  // /health
  bot.command('health', async (ctx) => {
    if (!isUserAdmin(ctx.from.id)) {
      return ctx.reply('🟢 البوت يعمل بصحة جيدة.');
    }
    const health = await checkHealth();
    const text = '🩺 **تقرير صحة النظام:**\n\n' +
      `الحالة: **${health.status}**\n` +
      `مدة التشغيل: **${health.uptimeSeconds} ثانية**\n` +
      `قاعدة البيانات: **${health.database.status}** (${health.database.latencyMs}ms)\n` +
      `الذاكرة (Heap): **${health.memory.heapUsedMb}MB / ${health.memory.heapTotalMb}MB**`;
    return ctx.reply(text, { parse_mode: 'Markdown' });
  });
}
