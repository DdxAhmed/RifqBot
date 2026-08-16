import { prisma } from '../database/prisma.js';
import { getAdhkarList } from '../data/adhkar.data.js';
import { getTodayDateOnly, DEFAULT_TIMEZONE } from '../utils/timezone.js';

export async function getAdhkarSettings(userId) {
  let settings = await prisma.adhkarSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.adhkarSettings.create({
      data: { userId }
    });
  }
  return settings;
}

export async function updateAdhkarSettings(userId, updates) {
  return prisma.adhkarSettings.upsert({
    where: { userId },
    update: updates,
    create: { userId, ...updates }
  });
}

export async function getTodayAdhkarProgress(userId, kind = 'morning', zone = DEFAULT_TIMEZONE) {
  const date = getTodayDateOnly(zone);
  return prisma.adhkarProgress.findUnique({
    where: {
      userId_kind_date: {
        userId,
        kind,
        date
      }
    }
  });
}

export async function getTodayAdhkarStatus(userId, zone = DEFAULT_TIMEZONE) {
  const date = getTodayDateOnly(zone);
  const [morning, evening] = await Promise.all([
    prisma.adhkarProgress.findUnique({
      where: { userId_kind_date: { userId, kind: 'morning', date } }
    }),
    prisma.adhkarProgress.findUnique({
      where: { userId_kind_date: { userId, kind: 'evening', date } }
    })
  ]);

  return {
    morningCompleted: !!morning?.completed,
    eveningCompleted: !!evening?.completed,
    morningItemIndex: morning?.itemIndex ?? 0,
    eveningItemIndex: evening?.itemIndex ?? 0
  };
}

export async function saveAdhkarProgress(userId, kind = 'morning', itemIndex = 0, completed = false, zone = DEFAULT_TIMEZONE) {
  const date = getTodayDateOnly(zone);
  return prisma.adhkarProgress.upsert({
    where: {
      userId_kind_date: {
        userId,
        kind,
        date
      }
    },
    update: {
      itemIndex,
      completed
    },
    create: {
      userId,
      kind,
      date,
      itemIndex,
      completed
    }
  });
}

export function getAdhkarSessionState(kind = 'morning', index = 0) {
  const list = getAdhkarList(kind);
  const safeIndex = Math.max(0, Math.min(index, list.length - 1));
  const currentItem = list[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === list.length - 1;
  const total = list.length;

  return {
    kind,
    index: safeIndex,
    total,
    currentItem,
    isFirst,
    isLast,
    progressPercent: Math.round(((safeIndex + 1) / total) * 100)
  };
}
