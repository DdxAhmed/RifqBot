import { prisma } from '../../database/prisma.js';
import { getTodayAdhkarStatus } from '../../services/adhkar.service.js';
import { getNowInZone } from '../../utils/timezone.js';
import { adhkarMenuKeyboard } from '../../bot/keyboards/adhkar.keyboard.js';
import { logger } from '../../utils/logger.js';

export async function processAdhkarNotifications(bot) {
  try {
    const usersWithAdhkar = await prisma.user.findMany({
      where: {
        isBanned: false,
        settings: { notifications: true },
        adhkarSettings: {
          OR: [{ morningEnabled: true }, { eveningEnabled: true }]
        }
      },
      include: {
        adhkarSettings: true,
        settings: true
      }
    });

    for (const user of usersWithAdhkar) {
      const zone = user.timezone || 'Asia/Riyadh';
      const nowInZone = getNowInZone(zone);
      const currentTimeStr = nowInZone.toFormat('HH:mm');

      const adhkarSettings = user.adhkarSettings;
      if (!adhkarSettings) continue;

      const status = await getTodayAdhkarStatus(user.id, zone);

      // Morning check
      if (adhkarSettings.morningEnabled && !status.morningCompleted) {
        if (currentTimeStr === adhkarSettings.morningTime) {
          const sentKey = `adhkar_morning_${user.id}_${nowInZone.toFormat('yyyyMMdd')}`;
          await sendAdhkarAlert(bot, user, 'morning', sentKey);
        }
      }

      // Evening check
      if (adhkarSettings.eveningEnabled && !status.eveningCompleted) {
        if (currentTimeStr === adhkarSettings.eveningTime) {
          const sentKey = `adhkar_evening_${user.id}_${nowInZone.toFormat('yyyyMMdd')}`;
          await sendAdhkarAlert(bot, user, 'evening', sentKey);
        }
      }
    }
  } catch (error) {
    logger.error('Error in processAdhkarNotifications job:', error.message);
  }
}

// In-memory set to prevent double sends within the same minute
const sentNotifications = new Set();

async function sendAdhkarAlert(bot, user, kind, dedupeKey) {
  if (sentNotifications.has(dedupeKey)) return;
  sentNotifications.add(dedupeKey);

  // Auto clean old keys after 5 minutes
  setTimeout(() => sentNotifications.delete(dedupeKey), 5 * 60 * 1000);

  const title = kind === 'morning' ? '🌅 حان وقت أذكار الصباح' : '🌙 حان وقت أذكار المساء';
  const text = `${title} 🌿\n\n«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»\nابدأ جلستك الآن وواصل سلسلة إنجازك اليومي:`;

  try {
    const status = await getTodayAdhkarStatus(user.id, user.timezone);
    await bot.telegram.sendMessage(Number(user.telegramId), text, {
      parse_mode: 'Markdown',
      ...adhkarMenuKeyboard(status)
    });
    logger.info(`Adhkar alert sent user=${user.id} kind=${kind}`);
  } catch (err) {
    logger.warn(`Failed to send adhkar alert to user=${user.id}:`, err.message);
  }
}
