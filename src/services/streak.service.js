import { prisma } from '../database/prisma.js';
import { DateTime } from 'luxon';
import { getTodayDateOnly, DEFAULT_TIMEZONE } from '../utils/timezone.js';

export async function recordUserActivity(userId, type, entityId = null, metadata = null, zone = DEFAULT_TIMEZONE) {
  // 1. Log activity record
  await prisma.activity.create({
    data: {
      userId,
      type,
      entityId: entityId ? Number(entityId) : null,
      metadata: metadata || undefined
    }
  });

  // 2. Update streak safely
  return updateStreak(userId, zone);
}

export async function updateStreak(userId, zone = DEFAULT_TIMEZONE) {
  const today = getTodayDateOnly(zone);
  const todayDt = DateTime.fromJSDate(today).setZone(zone);

  let streak = await prisma.streak.findUnique({ where: { userId } });
  if (!streak) {
    streak = await prisma.streak.create({
      data: { userId, current: 0, longest: 0, lastDate: null }
    });
  }

  if (streak.lastDate) {
    const lastDt = DateTime.fromJSDate(streak.lastDate).setZone(zone);
    const diffDays = Math.floor(todayDt.diff(lastDt, 'days').days);

    // If already active today, do not increment streak again
    if (diffDays === 0) {
      return streak;
    }

    // If active yesterday, increment streak
    if (diffDays === 1) {
      const newCurrent = streak.current + 1;
      const newLongest = Math.max(streak.longest, newCurrent);
      return prisma.streak.update({
        where: { userId },
        data: {
          current: newCurrent,
          longest: newLongest,
          lastDate: today
        }
      });
    }

    // If more than 1 day has passed, streak is reset to 1
    const newCurrent = 1;
    const newLongest = Math.max(streak.longest, newCurrent);
    return prisma.streak.update({
      where: { userId },
      data: {
        current: newCurrent,
        longest: newLongest,
        lastDate: today
      }
    });
  }

  // First time ever recording streak
  return prisma.streak.update({
    where: { userId },
    data: {
      current: 1,
      longest: 1,
      lastDate: today
    }
  });
}

export async function getStreak(userId) {
  let streak = await prisma.streak.findUnique({ where: { userId } });
  if (!streak) {
    streak = await prisma.streak.create({
      data: { userId, current: 0, longest: 0, lastDate: null }
    });
  }
  return streak;
}
