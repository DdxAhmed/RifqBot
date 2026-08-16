import {
  getUserSettings,
  toggleSetting
} from '../../services/settings.service.js';
import { updateUserTimezone } from '../../services/user.service.js';
import {
  settingsMenuKeyboard,
  timezonePickerKeyboard
} from '../keyboards/settings.keyboard.js';

export function registerSettingsHandlers(bot) {
  // Toggle setting switches
  bot.action(/^stg_tgl:(morningSummary|eveningSummary|notifications|streakNotifications)$/, async (ctx) => {
    const key = ctx.match[1];
    const updatedSettings = await toggleSetting(ctx.state.user.id, key);
    await ctx.answerCbQuery('تم التحديث').catch(() => {});

    const text = '⚙️ **الإعدادات والتفضيلات**\n\n' +
      `المنطقة الزمنية الحالية: \`${ctx.state.user.timezone || 'Asia/Riyadh'}\`\n\n` +
      'تحكّم في خيارات التنبيهات والملخصات اليومية:';

    return ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...settingsMenuKeyboard(updatedSettings, ctx.state.user)
    });
  });

  // Timezone selection menu
  bot.action('stg:tz_menu', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(
      '🌐 **اختر منطقتك الزمنية:**\n\nتُستخدم لضبط مواعيد التذكيرات وتوليد الخطة اليومية بدقة:',
      { parse_mode: 'Markdown', ...timezonePickerKeyboard() }
    );
  });

  // Set timezone
  bot.action(/^stg_tz:(.+)$/, async (ctx) => {
    const timezone = ctx.match[1];
    const updatedUser = await updateUserTimezone(ctx.state.user.id, timezone);
    ctx.state.user = updatedUser;

    await ctx.answerCbQuery(`تم ضبط المنطقة الزمنية: ${timezone}`).catch(() => {});

    const settings = await getUserSettings(ctx.state.user.id);
    const text = '⚙️ **الإعدادات والتفضيلات**\n\n' +
      `المنطقة الزمنية الحالية: \`${updatedUser.timezone}\`\n\n` +
      'تحكّم في خيارات التنبيهات والملخصات اليومية:';

    return ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...settingsMenuKeyboard(settings, updatedUser)
    });
  });
}
