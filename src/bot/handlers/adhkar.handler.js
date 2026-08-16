import {
  getAdhkarSettings,
  updateAdhkarSettings,
  saveAdhkarProgress,
  getAdhkarSessionState
} from '../../services/adhkar.service.js';
import { recordUserActivity } from '../../services/streak.service.js';
import {
  adhkarSessionKeyboard,
  adhkarSettingsKeyboard
} from '../keyboards/adhkar.keyboard.js';
import { cancelKeyboard, backKeyboard } from '../keyboards/main.keyboard.js';

export function registerAdhkarHandlers(bot) {
  // Start Adhkar session
  bot.action(/^adh_start:(morning|evening)$/, async (ctx) => {
    const kind = ctx.match[1];
    await ctx.answerCbQuery().catch(() => {});

    const state = getAdhkarSessionState(kind, 0);
    const title = kind === 'morning' ? '🌅 أذكار الصباح' : '🌙 أذكار المساء';

    const text = `**${title}** (1/${state.total})\n\n` +
      `«${state.currentItem.text}»\n\n` +
      `📖 **المصدر:** ${state.currentItem.reference}\n` +
      `🔢 **عدد التكرار المطلوب:** ${state.currentItem.count}`;

    return ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...adhkarSessionKeyboard({
        kind,
        index: 0,
        total: state.total,
        isFirst: true,
        isLast: state.isLast,
        currentCount: 0,
        targetCount: state.currentItem.count
      })
    });
  });

  // Step counter progression
  bot.action(/^adh_step:(morning|evening):(\d+):(\d+)$/, async (ctx) => {
    const kind = ctx.match[1];
    const index = parseInt(ctx.match[2], 10);
    const count = parseInt(ctx.match[3], 10);

    const state = getAdhkarSessionState(kind, index);
    const title = kind === 'morning' ? '🌅 أذكار الصباح' : '🌙 أذكار المساء';

    // If target count reached, auto-advance or celebrate item completion
    const target = state.currentItem.count;
    if (count >= target) {
      await ctx.answerCbQuery(`✅ تم إكمال الذكر (${target}/${target})`).catch(() => {});
      // Auto move to next item if not last
      if (!state.isLast) {
        const nextState = getAdhkarSessionState(kind, index + 1);
        const nextTitle = kind === 'morning' ? '🌅 أذكار الصباح' : '🌙 أذكار المساء';
        const nextText = `**${nextTitle}** (${index + 2}/${nextState.total})\n\n` +
          `«${nextState.currentItem.text}»\n\n` +
          `📖 **المصدر:** ${nextState.currentItem.reference}\n` +
          `🔢 **عدد التكرار المطلوب:** ${nextState.currentItem.count}`;

        return ctx.editMessageText(nextText, {
          parse_mode: 'Markdown',
          ...adhkarSessionKeyboard({
            kind,
            index: index + 1,
            total: nextState.total,
            isFirst: false,
            isLast: nextState.isLast,
            currentCount: 0,
            targetCount: nextState.currentItem.count
          })
        }).catch(() => {});
      }
    } else {
      await ctx.answerCbQuery(`📿 (${count}/${target})`).catch(() => {});
    }

    const text = `**${title}** (${index + 1}/${state.total})\n\n` +
      `«${state.currentItem.text}»\n\n` +
      `📖 **المصدر:** ${state.currentItem.reference}\n` +
      `🔢 **عدد التكرار المطلوب:** ${state.currentItem.count}`;

    return ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...adhkarSessionKeyboard({
        kind,
        index,
        total: state.total,
        isFirst: state.isFirst,
        isLast: state.isLast,
        currentCount: count,
        targetCount: target
      })
    }).catch(() => {});
  });

  // Navigate between items
  bot.action(/^adh_nav:(morning|evening):(\d+)$/, async (ctx) => {
    const kind = ctx.match[1];
    const index = parseInt(ctx.match[2], 10);
    await ctx.answerCbQuery().catch(() => {});

    const state = getAdhkarSessionState(kind, index);
    const title = kind === 'morning' ? '🌅 أذكار الصباح' : '🌙 أذكار المساء';

    const text = `**${title}** (${index + 1}/${state.total})\n\n` +
      `«${state.currentItem.text}»\n\n` +
      `📖 **المصدر:** ${state.currentItem.reference}\n` +
      `🔢 **عدد التكرار المطلوب:** ${state.currentItem.count}`;

    return ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...adhkarSessionKeyboard({
        kind,
        index,
        total: state.total,
        isFirst: state.isFirst,
        isLast: state.isLast,
        currentCount: 0,
        targetCount: state.currentItem.count
      })
    }).catch(() => {});
  });

  // Finish session
  bot.action(/^adh_finish:(morning|evening)$/, async (ctx) => {
    const kind = ctx.match[1];
    await saveAdhkarProgress(ctx.state.user.id, kind, 0, true, ctx.state.user.timezone);
    await recordUserActivity(ctx.state.user.id, 'ADHKAR_COMPLETED', null, { kind }, ctx.state.user.timezone);

    await ctx.answerCbQuery('🎉 تقبل الله منك!').catch(() => {});

    const title = kind === 'morning' ? 'أذكار الصباح' : 'أذكار المساء';
    const text = `🎉 **هنيئًا لك إتمام ${title}!**\n\n` +
      'تقبل الله طاعتك وحفظك بحفظه.\n' +
      'تم تسجيل إنجازك وتحديث سلسلتك اليومية 🌿';

    return ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...backKeyboard('nav:adhkar')
    });
  });

  // Adhkar Settings
  bot.action('adh_settings', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const settings = await getAdhkarSettings(ctx.state.user.id);
    const text = '⚙️ **إعدادات الأذكار اليومية**\n\nتحكّم في تفعيل تنبيهات الصباح والمساء وأوقاتها المفضلة:';
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...adhkarSettingsKeyboard(settings) });
  });

  // Toggle settings
  bot.action(/^adh_tgl:(morningEnabled|eveningEnabled)$/, async (ctx) => {
    const key = ctx.match[1];
    const settings = await getAdhkarSettings(ctx.state.user.id);
    const updated = await updateAdhkarSettings(ctx.state.user.id, { [key]: !settings[key] });
    await ctx.answerCbQuery('تم التحديث').catch(() => {});

    const text = '⚙️ **إعدادات الأذكار اليومية**\n\nتحكّم في تفعيل تنبيهات الصباح والمساء وأوقاتها المفضلة:';
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...adhkarSettingsKeyboard(updated) });
  });

  // Set time prompt
  bot.action(/^adh_set_time:(morning|evening)$/, async (ctx) => {
    const kind = ctx.match[1];
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'adhkar_time_set', kind });

    const title = kind === 'morning' ? 'أذكار الصباح' : 'أذكار المساء';
    const defaultTime = kind === 'morning' ? '06:00' : '18:00';

    return ctx.editMessageText(
      `⏰ **تعديل وقت ${title}**\n\nأرسل الوقت المرغوب بنظام 24 ساعة (مثال: \`${defaultTime}\` أو \`07:30\`):`,
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    );
  });
}
