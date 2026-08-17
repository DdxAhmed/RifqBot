import { listTodayGoals, addGoal } from '../../services/goals.service.js';
import { sanitizeText } from '../../utils/validation.js';
import { goalsMenuKeyboard } from '../keyboards/goals.keyboard.js';
import { mainMenuKeyboard } from '../keyboards/main.keyboard.js';

export function registerGoalsCommand(bot) {
  bot.command(['goals', 'goal'], async (ctx) => {
    const rawArg = ctx.message.text.replace(/^\/goals?(\s+|$)/i, '').trim();
    if (rawArg) {
      const title = sanitizeText(rawArg, 200);
      await addGoal(ctx.state.user.id, title, ctx.state.user.timezone);
      return ctx.reply(`🎯 **تمت إضافة الهدف:** "${title}"\nبالتوفيق في تحقيقه! 🌿`, {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard()
      });
    }

    ctx.userSession?.clear();
    const goals = await listTodayGoals(ctx.state.user.id, ctx.state.user.timezone);
    const text = goals.length > 0
      ? '🎯 **أهداف اليوم:**\nاضغط على الهدف لتحديده كمكتمل أو غير مكتمل:'
      : '🎯 **أهدافي**\n\nلا توجد أهداف مسجلة لليوم. اضغط على الزر أدناه لإضافة هدف:';

    return ctx.reply(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) });
  });
}
