import { Markup } from 'telegraf';
import { backToMainMenuButton } from './main.keyboard.js';

export const remindersMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ إضافة تذكير جديد', 'rem:add'),
      Markup.button.callback('📋 قائمة التذكيرات', 'rem:list')
    ],
    [backToMainMenuButton()]
  ]);
};

export const reminderRecurrenceKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('مرة واحدة', 'rem_rec:ONCE'),
      Markup.button.callback('يوميًا', 'rem_rec:DAILY')
    ],
    [
      Markup.button.callback('أسبوعيًا', 'rem_rec:WEEKLY'),
      Markup.button.callback('❌ إلغاء', 'cancel_flow')
    ]
  ]);
};

export const reminderAlertKeyboard = (reminderId) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ تم الإنجاز', `rem_act:done:${reminderId}`),
      Markup.button.callback('⏰ تأجيل 10د', `rem_act:snooze:${reminderId}:10`)
    ],
    [
      Markup.button.callback('⏰ تأجيل ساعة', `rem_act:snooze:${reminderId}:60`)
    ]
  ]);
};

export const reminderItemKeyboard = (reminderId) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ تم', `rem_act:done:${reminderId}`),
      Markup.button.callback('🗑️ حذف', `rem_act:del:${reminderId}`)
    ],
    [Markup.button.callback('🔙 قائمة التذكيرات', 'rem:list')]
  ]);
};

export const remindersListKeyboard = (reminders) => {
  const rows = reminders.map((r) => [
    Markup.button.callback(`⏰ ${r.title}`, `rem_view:${r.id}`),
    Markup.button.callback('🗑️', `rem_act:del:${r.id}`)
  ]);

  rows.push([Markup.button.callback('➕ إضافة تذكير جديد', 'rem:add')]);
  rows.push([backToMainMenuButton()]);

  return Markup.inlineKeyboard(rows);
};
