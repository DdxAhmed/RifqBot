import { Markup } from 'telegraf';
import { backToMainMenuButton } from './main.keyboard.js';

export const adhkarMenuKeyboard = (todayStatus) => {
  const morningText = todayStatus?.morningCompleted ? '🌅 أذكار الصباح (✅ تم)' : '🌅 أذكار الصباح';
  const eveningText = todayStatus?.eveningCompleted ? '🌙 أذكار المساء (✅ تم)' : '🌙 أذكار المساء';
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(morningText, 'adh_start:morning'),
      Markup.button.callback(eveningText, 'adh_start:evening')
    ],
    [
      Markup.button.callback('⚙️ إعدادات الأذكار', 'adh_settings')
    ],
    [backToMainMenuButton()]
  ]);
};

export const adhkarSessionKeyboard = ({ kind, index, isFirst, isLast, currentCount, targetCount }) => {
  const rows = [];

  // Counter button: clicking it counts down or indicates progress
  const countLabel = currentCount > 0 ? `📿 التكرار (${currentCount}/${targetCount})` : '✅ تم التكرار';
  rows.push([
    Markup.button.callback(countLabel, `adh_step:${kind}:${index}:${currentCount + 1}`)
  ]);

  const navRow = [];
  if (!isFirst) {
    navRow.push(Markup.button.callback('⬅️ السابق', `adh_nav:${kind}:${index - 1}`));
  }
  if (!isLast) {
    navRow.push(Markup.button.callback('التالي ➡️', `adh_nav:${kind}:${index + 1}`));
  } else {
    navRow.push(Markup.button.callback('🎉 إتمام الختام', `adh_finish:${kind}`));
  }
  rows.push(navRow);

  rows.push([
    Markup.button.callback('🚪 خروج من الجلسة', 'nav:adhkar')
  ]);

  return Markup.inlineKeyboard(rows);
};

export const adhkarSettingsKeyboard = (settings) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `أذكار الصباح: ${settings.morningEnabled ? '🟢 مفعلة' : '🔴 معطلة'}`,
        'adh_tgl:morningEnabled'
      )
    ],
    [
      Markup.button.callback(
        `أذكار المساء: ${settings.eveningEnabled ? '🟢 مفعلة' : '🔴 معطلة'}`,
        'adh_tgl:eveningEnabled'
      )
    ],
    [
      Markup.button.callback(
        `توقيت الصباح: ${settings.morningTime}`,
        'adh_set_time:morning'
      ),
      Markup.button.callback(
        `توقيت المساء: ${settings.eveningTime}`,
        'adh_set_time:evening'
      )
    ],
    [
      Markup.button.callback('🔙 رجوع للأذكار', 'nav:adhkar')
    ]
  ]);
};