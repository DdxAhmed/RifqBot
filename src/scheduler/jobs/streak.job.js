import { prisma } from '../../database/prisma.js';
import { getNowInZone, getTodayDateOnly } from '../../utils/timezone.js';
import { logger } from '../../utils/logger.js';

const sentStreakAlerts = new Set();

export async function processStreakReminders(bot) {
  try {
    const users = await prisma.user.findMany({
      where: {
        isBanned: false,
        settings: {
          notifications: true,
          streakNotifications: true
        },
        streak: {
          current: { gt: 0 }
        }
      },
      include: {
        streak: true,
        settings: true
      }
    });

    for (const user of users) {
      const zone = user.timezone || 'Asia/Riyadh';
      const nowInZone = getNowInZone(zone);
      const currentTimeStr = nowInZone.toFormat('HH:mm');
      const dateStr = nowInZone.toFormat('yyyyMMdd');

      // Send reminder around 20:30 if user has no activity recorded today
      if (currentTimeStr === '20:30') {
        const todayDateOnly = getTodayDateOnly(zone);
        if (user.streak?.lastDate && user.streak.lastDate.getTime() === todayDateOnly.getTime()) {
          // Already recorded activity today
          continue;
        }

        const dedupeKey = `streak_${user.id}_${dateStr}`;
        if (!sentStreakAlerts.has(dedupeKey)) {
          sentStreakAlerts.add(dedupeKey);
          setTimeout(() => sentStreakAlerts.delete(dedupeKey), 5 * 60 * 1000);

          try {
            const msg = '🔥 **تنبيه للحفاظ على سلسلتك!**\n\n' +
              `سلسلتك الحالية: **${user.streak.current} يوم متواصل** 👏\n` +
              'سجّل إنجاز هدف أو قراءة ورد أو إنهاء درس قبل نهاية اليوم حتى لا تنقطع السلسلة!';

            await bot.telegram.sendMessage(Number(user.telegramId), msg, { parse_mode: 'Markdown' });
            logger.info(`Streak reminder sent to user=${user.id}`);
          } catch (err) {
            logger.warn(`Failed to send streak reminder to user=${user.id}:`, err.message);
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error in processStreakReminders job:', error.message);
  }
}
