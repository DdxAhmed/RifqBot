import { Markup } from 'telegraf';
import { backToMainMenuButton } from './main.keyboard.js';

export const adminDashboardKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 تحديث الإحصائيات', 'adm:stats'),
      Markup.button.callback('👥 أحدث المستخدمين', 'adm:users')
    ],
    [
      Markup.button.callback('📢 إذاعة رسالة جماعية', 'adm:broadcast'),
      Markup.button.callback('🚫 حظر / إلغاء حظر', 'adm:ban_prompt')
    ],
    [backToMainMenuButton()]
  ]);
};
