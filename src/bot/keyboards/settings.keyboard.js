import { Markup } from 'telegraf';
import { backToMainMenuButton } from './main.keyboard.js';

export const settingsMenuKeyboard = (settings, user) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `ملخص الصباح: ${settings.morningSummary ? '🟢 مفعل' : '🔴 معطل'}`,
        'stg_tgl:morningSummary'
      ),
      Markup.button.callback(
        `ملخص المساء: ${settings.eveningSummary ? '🟢 مفعل' : '🔴 معطل'}`,
        'stg_tgl:eveningSummary'
      )
    ],
    [
      Markup.button.callback(
        `التنبيهات: ${settings.notifications ? '🟢 مفعلة' : '🔴 معطلة'}`,
        'stg_tgl:notifications'
      ),
      Markup.button.callback(
        `سلسلة الإنجاز: ${settings.streakNotifications ? '🟢 مفعلة' : '🔴 معطلة'}`,
        'stg_tgl:streakNotifications'
      )
    ],
    [
      Markup.button.callback(`🌐 المنطقة الزمنية (${user.timezone || 'Asia/Riyadh'})`, 'stg:tz_menu')
    ],
    [backToMainMenuButton()]
  ]);
};

export const timezonePickerKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🇸🇦 مكة المكرمة / الرياض', 'stg_tz:Asia/Riyadh'),
      Markup.button.callback('🇪🇬 القاهرة', 'stg_tz:Africa/Cairo')
    ],
    [
      Markup.button.callback('🇦🇪 الإمارات / دبي', 'stg_tz:Asia/Dubai'),
      Markup.button.callback('🇯🇴 عمّان / القدس', 'stg_tz:Asia/Amman')
    ],
    [
      Markup.button.callback('🇲🇦 المغرب / الرباط', 'stg_tz:Africa/Casablanca'),
      Markup.button.callback('🇩🇿 الجزائر / تونس', 'stg_tz:Africa/Algiers')
    ],
    [
      Markup.button.callback('🇹🇷 إسطنبول', 'stg_tz:Europe/Istanbul'),
      Markup.button.callback('🇬🇧 لندن (UTC)', 'stg_tz:UTC')
    ],
    [Markup.button.callback('🔙 رجوع للإعدادات', 'nav:settings')]
  ]);
};
