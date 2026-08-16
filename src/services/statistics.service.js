import { prisma } from '../database/prisma.js';
import { getStreak } from './streak.service.js';

export async function getUserStatistics(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    completedReminders,
    completedLessons,
    completedGoals,
    completedAdhkar,
    streak,
    activity7d,
    activity30d
  ] = await Promise.all([
    prisma.reminder.count({ where: { userId, completedAt: { not: null } } }),
    prisma.lesson.count({ where: { course: { userId }, completed: true } }),
    prisma.dailyGoal.count({ where: { userId, completed: true } }),
    prisma.adhkarProgress.count({ where: { userId, completed: true } }),
    getStreak(userId),
    prisma.activity.count({ where: { userId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.activity.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } })
  ]);

  return {
    completedReminders,
    completedLessons,
    completedGoals,
    completedAdhkar,
    currentStreak: streak?.current ?? 0,
    longestStreak: streak?.longest ?? 0,
    activity7d,
    activity30d
  };
}
