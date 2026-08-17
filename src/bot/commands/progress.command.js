import { getUserStatistics } from '../../services/statistics.service.js';
import { progressKeyboard } from '../keyboards/main.keyboard.js';

export function formatProgressMessage(stats) {
  return '📊 **إحصائيات تقدمك وإنجازاتك** 🌿\n\n' +
    `🔥 **السلسلة الحالية:** ${stats.currentStreak} يوم\n` +
    `🏆 **أطول سلسلة:** ${stats.longestStreak} يوم\n\n` +
    `✅ **التذكيرات المنجزة:** ${stats.completedReminders}\n` +
    `📚 **الدروس المكتملة:** ${stats.completedLessons}\n` +
    `🎯 **الأهداف المحققة:** ${stats.completedGoals}\n` +
    `🤲 **جلسات الأذكار المكتملة:** ${stats.completedAdhkar}\n\n` +
    `⚡ **نشاط آخر 7 أيام:** ${stats.activity7d} عملية\n` +
    `📈 **نشاط آخر 30 يومًا:** ${stats.activity30d} عملية`;
}

export function registerProgressCommand(bot) {
  bot.command(['progress', 'stats'], async (ctx) => {
    ctx.userSession?.clear();
    const stats = await getUserStatistics(ctx.state.user.id);
    const text = formatProgressMessage(stats);
    return ctx.reply(text, { parse_mode: 'Markdown', ...progressKeyboard() });
  });
}
