import { Markup } from 'telegraf';

export const mainMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📅 خطتي اليوم', 'nav:today'),
      Markup.button.callback('⏰ التذكيرات', 'nav:reminders')
    ],
    [
      Markup.button.callback('📚 كورساتي', 'nav:courses'),
      Markup.button.callback('🕌 الأذكار', 'nav:adhkar')
    ],
    [
      Markup.button.callback('🎯 أهدافي', 'nav:goals'),
      Markup.button.callback('📝 ملاحظاتي', 'nav:notes')
    ],
    [
      Markup.button.callback('📊 إحصائياتي', 'nav:stats'),
      Markup.button.callback('⚙️ الإعدادات', 'nav:settings')
    ]
  ]);
};

export const backToMainMenuButton = () => {
  return Markup.button.callback('🔙 القائمة الرئيسية', 'nav:main');
};

export const cancelButton = () => {
  return Markup.button.callback('❌ إلغاء', 'cancel_flow');
};

export const cancelKeyboard = () => {
  return Markup.inlineKeyboard([[cancelButton()]]);
};

export const backKeyboard = (backAction = 'nav:main') => {
  return Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', backAction)]]);
};
