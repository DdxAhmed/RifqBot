import { getUserSettings } from '../../services/settings.service.js';
import { settingsMenuKeyboard } from '../keyboards/settings.keyboard.js';

export function registerSettingsCommand(bot) {
  bot.command('settings', async (ctx) => {
    ctx.userSession?.clear();
    const settings = await getUserSettings(ctx.state.user.id);
    const text = '⚙️ **الإعدادات والتفضيلات**\n\n' +
      `المنطقة الزمنية الحالية: \`${ctx.state.user.timezone || 'Asia/Riyadh'}\`\n\n` +
      'تحكّم في خيارات التنبيهات والملخصات اليومية:';

    return ctx.reply(text, { parse_mode: 'Markdown', ...settingsMenuKeyboard(settings, ctx.state.user) });
  });
}
