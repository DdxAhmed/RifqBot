import { Markup } from 'telegraf';
import { homeButton, backButton } from './main.keyboard.js';

export const remindersMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ إضافة تذكير', 'rem:add')
    ],
    [
      Markup.button.callback('📋 كل التذكيرات', 'rem:list'),
      Markup.button.callback('🔁 المتكررة', 'rem:recurring')
    ],
    [
      Markup.button.callback('✅ المكتملة', 'rem:completed')
    ],
    [
      homeButton()
    ]
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
      Markup.button.callback('✅ تم الإنجاز', `rem_act:done:${reminderId}`),
      Markup.button.callback('🗑️ حذف', `rem_act:del:${reminderId}`)
    ],
    [
      backButton('rem:list'),
      homeButton()
    ]
  ]);
};

export const remindersListKeyboard = (reminders, backAction = 'menu:reminders') => {
  const rows = reminders.map((r) => [
    Markup.button.callback(`⏰ ${r.title}`, `rem_view:${r.id}`),
    Markup.button.callback('🗑️', `rem_act:del:${r.id}`)
  ]);

  rows.push([
    Markup.button.callback('➕ إضافة تذكير جديد', 'rem:add')
  ]);
  rows.push([
    backButton(backAction),
    homeButton()
  ]);

  return Markup.inlineKeyboard(rows);
};

export const completedRemindersKeyboard = (reminders) => {
  const rows = reminders.map((r) => [
    Markup.button.callback(`✅ ${r.title}`, `rem_view:${r.id}`)
  ]);

  rows.push([
    backButton('menu:reminders'),
    homeButton()
  ]);

  return Markup.inlineKeyboard(rows);
};
