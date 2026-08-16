import { prisma } from '../../database/prisma.js';
import { generateDailyPlan } from '../../services/plan.service.js';
import { getNowInZone } from '../../utils/timezone.js';
import { mainMenuKeyboard } from '../../bot/keyboards/main.keyboard.js';
import { logger } from '../../utils/logger.js';

const sentSummaries = new Set();

export async function processDailySummaries(bot) {
  try {
    const users = await prisma.user.findMany({
      where: {
        isBanned: false,
        settings: {
          notifications: true,
          OR: [{ morningSummary: true }, { eveningSummary: true }]
        }
      },
      include: {
        settings: true
      }
    });

    for (const user of users) {
      const zone = user.timezone || 'Asia/Riyadh';
      const nowInZone = getNowInZone(zone);
      const currentTimeStr = nowInZone.toFormat('HH:mm');
      const dateStr = nowInZone.toFormat('yyyyMMdd');

      // Morning summary at 07:30
      if (user.settings?.morningSummary && currentTimeStr === '07:30') {
        const dedupeKey = `summary_m_${user.id}_${dateStr}`;
        if (!sentSummaries.has(dedupeKey)) {
          sentSummaries.add(dedupeKey);
          setTimeout(() => sentSummaries.delete(dedupeKey), 5 * 60 * 1000);
          await sendSummaryMessage(bot, user, 'morning', zone);
        }
      }

      // Evening summary at 21:00
      if (user.settings?.eveningSummary && currentTimeStr === '21:00') {
        const dedupeKey = `summary_e_${user.id}_${dateStr}`;
        if (!sentSummaries.has(dedupeKey)) {
          sentSummaries.add(dedupeKey);
          setTimeout(() => sentSummaries.delete(dedupeKey), 5 * 60 * 1000);
          await sendSummaryMessage(bot, user, 'evening', zone);
        }
      }
    }
  } catch (error) {
    logger.error('Error in processDailySummaries job:', error.message);
  }
}

async function sendSummaryMessage(bot, user, kind, zone) {
  try {
    const plan = await generateDailyPlan(user.id, zone);
    const title = kind === 'morning' ? '☀️ **صباح الخير! خطتك لليوم:**' : '🌙 **مساء الخير! ملخص إنجاز اليوم:**';

    let text = `${title}\n\n`;
    text += `🔥 السلسلة الحالية: **${plan.streak.current} يوم**\n\n`;

    text += `⏰ التذكيرات: ${plan.reminders.length} تذكير\n`;
    text += `🎯 الأهداف: ${plan.goals.filter((g) => g.completed).length} من ${plan.goals.length} مكتملة\n`;
    text += `🕌 الأذكار: ${plan.adhkar.morningCompleted ? '✅ الصباح' : '⏳ الصباح'} | ${plan.adhkar.eveningCompleted ? '✅ المساء' : '⏳ المساء'}\n\n`;
    text += 'اضغط أدناه لعرض التفاصيل وإدارة يومك 🌿';

    await bot.telegram.sendMessage(Number(user.telegramId), text, {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard()
    });
    logger.info(`Daily summary sent to user=${user.id} kind=${kind}`);
  } catch (err) {
    logger.warn(`Failed to send daily summary to user=${user.id}:`, err.message);
  }
}
