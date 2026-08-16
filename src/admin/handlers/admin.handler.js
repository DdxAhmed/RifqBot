import {
  getAdminDashboardStats,
  listRecentUsers,
  isUserAdmin
} from '../services/admin.service.js';
import { adminDashboardKeyboard } from '../../bot/keyboards/admin.keyboard.js';
import { cancelKeyboard, backKeyboard } from '../../bot/keyboards/main.keyboard.js';

export function registerAdminHandlers(bot) {
  // Admin stats refresh
  bot.action('adm:stats', async (ctx) => {
    if (!isUserAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('غير مصرح لك.', { show_alert: true });
      return;
    }

    await ctx.answerCbQuery().catch(() => {});
    const stats = await getAdminDashboardStats();

    const text = '👑 **لوحة تحكم الإدارة - رِفْق**\n\n' +
      `👥 إجمالي المستخدمين: **${stats.totalUsers}**\n` +
      `⚡ المستخدمين النشطين (24 ساعة): **${stats.activeUsers24hCount}**\n` +
      `🚫 المستخدمين المحظورين: **${stats.bannedUsers}**\n\n` +
      `⏰ التذكيرات النشطة: **${stats.activeReminders}**\n` +
      `📚 إجمالي الكورسات: **${stats.totalCourses}**\n` +
      `🎯 إجمالي الأهداف: **${stats.totalDailyGoals}**`;

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...adminDashboardKeyboard() });
  });

  // Admin list recent users
  bot.action('adm:users', async (ctx) => {
    if (!isUserAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('غير مصرح لك.', { show_alert: true });
      return;
    }

    await ctx.answerCbQuery().catch(() => {});
    const users = await listRecentUsers(10);

    let text = `👥 **أحدث ${users.length} مستخدمين:**\n\n`;
    users.forEach((u, i) => {
      const name = u.firstName || 'بدون اسم';
      const streak = u.streak?.current || 0;
      const ban = u.isBanned ? ' [محظور]' : '';
      text += `${i + 1}. **${name}** (ID: \`${u.telegramId}\`)${ban}\n   🔥 السلسلة: ${streak} | ⏰ تذكيرات: ${u._count.reminders} | 📚 كورسات: ${u._count.courses}\n`;
    });

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...backKeyboard('adm:stats') });
  });

  // Prompt broadcast
  bot.action('adm:broadcast', async (ctx) => {
    if (!isUserAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('غير مصرح لك.', { show_alert: true });
      return;
    }

    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'admin_broadcast' });
    return ctx.editMessageText(
      '📢 **إذاعة رسالة جماعية**\n\nأرسل نص الرسالة المراد إرسالها إلى جميع المستخدمين النشطين:',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    );
  });

  // Prompt ban/unban
  bot.action('adm:ban_prompt', async (ctx) => {
    if (!isUserAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('غير مصرح لك.', { show_alert: true });
      return;
    }

    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'admin_ban_toggle' });
    return ctx.editMessageText(
      '🚫 **حظر / إلغاء حظر مستخدم**\n\nأرسل Telegram ID للمستخدم (أرقام فقط):',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    );
  });
}
