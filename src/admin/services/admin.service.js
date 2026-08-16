import { prisma } from '../../database/prisma.js';
import { env } from '../../config/env.js';

export function isUserAdmin(telegramId) {
  return env.isAdmin(telegramId);
}

export async function getAdminDashboardStats() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    bannedUsers,
    activeReminders,
    totalCourses,
    totalDailyGoals,
    activeUsers24h
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.reminder.count({ where: { active: true } }),
    prisma.course.count(),
    prisma.dailyGoal.count(),
    prisma.activity.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      distinct: ['userId'],
      select: { userId: true }
    })
  ]);

  return {
    totalUsers,
    bannedUsers,
    activeReminders,
    totalCourses,
    totalDailyGoals,
    activeUsers24hCount: activeUsers24h.length
  };
}

export async function listRecentUsers(limit = 10) {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      streak: true,
      _count: {
        select: {
          reminders: true,
          courses: true,
          goals: true
        }
      }
    }
  });
}

export async function setBanStatus(adminId, targetTelegramId, isBanned) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(targetTelegramId) }
  });

  if (!user) return null;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isBanned }
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
      targetId: BigInt(targetTelegramId),
      metadata: { targetUserId: user.id }
    }
  });

  return updated;
}

export async function logAdminAction(adminId, action, targetId = null, metadata = null) {
  return prisma.adminAction.create({
    data: {
      adminId,
      action,
      targetId: targetId ? BigInt(targetId) : null,
      metadata: metadata || undefined
    }
  });
}

export async function getAllActiveTelegramIds() {
  const users = await prisma.user.findMany({
    where: { isBanned: false },
    select: { telegramId: true }
  });
  return users.map((u) => u.telegramId.toString());
}
