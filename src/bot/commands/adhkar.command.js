import { getTodayAdhkarStatus } from '../../services/adhkar.service.js';
import { adhkarMenuKeyboard } from '../keyboards/adhkar.keyboard.js';

export function registerAdhkarCommand(bot) {
  bot.command(['adhkar', 'azkar'], async (ctx) => {
    ctx.userSession?.clear();
    const todayStatus = await getTodayAdhkarStatus(ctx.state.user.id, ctx.state.user.timezone);
    const text = '🤲 **أذكاري اليومية**\n\n«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» 🌿\n\nاختر الجلسة التي ترغب في بدئها:';
    return ctx.reply(text, { parse_mode: 'Markdown', ...adhkarMenuKeyboard(todayStatus) });
  });
}
