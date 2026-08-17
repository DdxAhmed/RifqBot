import { Markup } from 'telegraf';
import { homeButton } from './main.keyboard.js';

export const goalsMenuKeyboard = (goals = []) => {
  const rows = [];

  rows.push([
    Markup.button.callback('➕ إضافة هدف', 'goal:add')
  ]);

  goals.forEach((g) => {
    rows.push([
      Markup.button.callback(
        `${g.completed ? '✅' : '⬜'} ${g.title}`,
        `goal_tgl:${g.id}`
      ),
      Markup.button.callback('🗑️', `goal_del:${g.id}`)
    ]);
  });

  rows.push([
    Markup.button.callback('📅 خطتي اليوم', 'menu:plan'),
    Markup.button.callback('📊 تقدمي', 'menu:progress')
  ]);

  rows.push([
    homeButton()
  ]);

  return Markup.inlineKeyboard(rows);
};
