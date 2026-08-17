import { getAdminDashboardStats, isUserAdmin } from '../../admin/services/admin.service.js';
import { adminDashboardKeyboard } from '../keyboards/admin.keyboard.js';
import { checkHealth } from '../../utils/health.js';

export function registerAdminCommands(bot) {
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
