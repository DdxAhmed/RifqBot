import {
  listTodayGoals,
  toggleGoalCompletion,
  deleteGoal
} from '../../services/goals.service.js';
import { recordUserActivity } from '../../services/streak.service.js';
import { goalsMenuKeyboard } from '../keyboards/goals.keyboard.js';
import { cancelKeyboard } from '../keyboards/main.keyboard.js';

export function registerGoalsHandlers(bot) {
  // Start add goal prompt
  bot.action('goal:add', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'goal_add', step: 'title' });
    return ctx.editMessageText(
      '🎯 **إضافة هدف لليوم**\n\nأرسل عنوان الهدف المراد تحقيقه اليوم (مثل: إنهاء الفصل الأول، ممارسة الرياضة 20 دقيقة، ترتيب المكتب):',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    ).catch(() => ctx.reply('أرسل عنوان الهدف:', cancelKeyboard()));
  });

  // Toggle goal completion
  bot.action(/^goal_tgl:(\d+)$/, async (ctx) => {
    const goalId = parseInt(ctx.match[1], 10);
    const updatedGoal = await toggleGoalCompletion(goalId, ctx.state.user.id);

    if (!updatedGoal) {
      await ctx.answerCbQuery('تعذر تعديل الهدف').catch(() => {});
      return;
    }

    if (updatedGoal.completed) {
      await recordUserActivity(ctx.state.user.id, 'GOAL_COMPLETED', goalId, null, ctx.state.user.timezone);
      await ctx.answerCbQuery('🎉 أحسنت! تم إنجاز الهدف.').catch(() => {});
    } else {
      await ctx.answerCbQuery('تم التراجع عن إكمال الهدف.').catch(() => {});
    }

    const goals = await listTodayGoals(ctx.state.user.id, ctx.state.user.timezone);
    const text = goals.length > 0
      ? '🎯 **أهداف اليوم:**\nاضغط على الهدف للتبديل بين مكتمل وغير مكتمل:'
      : '🎯 **أهدافي اليومية**\n\nلا توجد أهداف مسجلة لليوم.';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) })
      .catch(() => {});
  });

  // Delete goal
  bot.action(/^goal_del:(\d+)$/, async (ctx) => {
    const goalId = parseInt(ctx.match[1], 10);
    await deleteGoal(goalId, ctx.state.user.id);
    await ctx.answerCbQuery('🗑️ تم حذف الهدف.').catch(() => {});

    const goals = await listTodayGoals(ctx.state.user.id, ctx.state.user.timezone);
    const text = goals.length > 0
      ? '🎯 **أهداف اليوم:**\nاضغط على الهدف للتبديل بين مكتمل وغير مكتمل:'
      : '🎯 **أهدافي اليومية**\n\nلا توجد أهداف مسجلة لليوم.';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) })
      .catch(() => {});
  });
}
