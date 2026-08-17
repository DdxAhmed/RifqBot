import { Markup } from 'telegraf';

/**
 * Arabic-first main inline menu keyboard
 */
export const mainMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📅 خطتي اليوم', 'menu:plan')
    ],
    [
      Markup.button.callback('➕ إضافة', 'menu:add')
    ],
    [
      Markup.button.callback('⏰ تذكيراتي', 'menu:reminders'),
      Markup.button.callback('📚 كورساتي', 'menu:courses')
    ],
    [
      Markup.button.callback('🎯 أهدافي', 'menu:goals'),
      Markup.button.callback('📝 ملاحظاتي', 'menu:notes')
    ],
    [
      Markup.button.callback('🤲 أذكاري', 'menu:adhkar'),
      Markup.button.callback('📊 تقدمي', 'menu:progress')
    ],
    [
      Markup.button.callback('⚙️ الإعدادات', 'menu:settings'),
      Markup.button.callback('❓ المساعدة', 'menu:help')
    ]
  ]);
};

/**
 * Universal quick-add menu keyboard
 */
export const quickAddKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('⏰ تذكير', 'rem:add'),
      Markup.button.callback('📚 كورس', 'crs:add')
    ],
    [
      Markup.button.callback('🎯 هدف', 'goal:add'),
      Markup.button.callback('📝 ملاحظة', 'note:add')
    ],
    [
      homeButton()
    ]
  ]);
};

/**
 * Daily Plan interactive action keyboard
 */
export const dailyPlanKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('▶️ ابدأ الآن', 'plan:start_now'),
      Markup.button.callback('🔄 تحديث', 'menu:plan')
    ],
    [
      homeButton()
    ]
  ]);
};

/**
 * Progress interactive action keyboard
 */
export const progressKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🔄 تحديث الإحصائيات', 'menu:progress')
    ],
    [
      homeButton()
    ]
  ]);
};

/**
 * Help screen interactive keyboard
 */
export const helpMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📅 خطتي اليوم', 'menu:plan'),
      Markup.button.callback('⏰ تذكيراتي', 'menu:reminders')
    ],
    [
      Markup.button.callback('📚 كورساتي', 'menu:courses'),
      Markup.button.callback('🤲 أذكاري', 'menu:adhkar')
    ],
    [
      homeButton()
    ]
  ]);
};

/**
 * Persistent Reply Keyboard for Telegram bottom menu bar
 */
export const persistentReplyKeyboard = () => {
  return Markup.keyboard([
    ['📅 خطتي اليوم', '⏰ تذكيراتي'],
    ['📚 كورساتي', '🎯 أهدافي'],
    ['📝 ملاحظاتي', '🤲 أذكاري'],
    ['📊 تقدمي', '⚙️ الإعدادات'],
    ['➕ إضافة', '❓ المساعدة']
  ]).resize();
};

export const homeButton = () => {
  return Markup.button.callback('🏠 الرئيسية', 'menu:home');
};

export const backToMainMenuButton = () => {
  return homeButton();
};

export const backButton = (target = 'menu:home') => {
  return Markup.button.callback('🔙 رجوع', target);
};

export const cancelButton = () => {
  return Markup.button.callback('❌ إلغاء', 'cancel_flow');
};

export const cancelKeyboard = () => {
  return Markup.inlineKeyboard([[cancelButton()]]);
};

export const backKeyboard = (backAction = 'menu:home') => {
  if (backAction === 'menu:home' || backAction === 'nav:main') {
    return Markup.inlineKeyboard([[homeButton()]]);
  }
  return Markup.inlineKeyboard([
    [backButton(backAction), homeButton()]
  ]);
};
