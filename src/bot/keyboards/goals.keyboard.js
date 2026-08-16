import { Markup } from 'telegraf';
import { backToMainMenuButton } from './main.keyboard.js';

export const goalsMenuKeyboard = (goals = []) => {
  const rows = goals.map((g) => [
    Markup.button.callback(
      `${g.completed ? '✅' : '⬜'} ${g.title}`,
      `goal_tgl:${g.id}`
    ),
    Markup.button.callback('🗑️', `goal_del:${g.id}`)
  ]);

  rows.push([Markup.button.callback('➕ إضافة هدف جديد', 'goal:add')]);
  rows.push([backToMainMenuButton()]);

  return Markup.inlineKeyboard(rows);
};
