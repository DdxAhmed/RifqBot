import { prisma } from '../database/prisma.js';
import { getDayBounds, getTodayDateOnly, DEFAULT_TIMEZONE } from '../utils/timezone.js';

export async function addGoal(userId, title, zone = DEFAULT_TIMEZONE) {
  const date = getTodayDateOnly(zone);
  return prisma.dailyGoal.create({
    data: {
      userId,
      title,
      date,
      completed: false
    }
  });
}

export async function listTodayGoals(userId, zone = DEFAULT_TIMEZONE) {
  const { start, end } = getDayBounds(zone);
  return prisma.dailyGoal.findMany({
    where: {
      userId,
      date: { gte: start, lte: end }
    },
    orderBy: { createdAt: 'asc' }
  });
}

export async function toggleGoalCompletion(goalId, userId) {
  const goal = await prisma.dailyGoal.findFirst({
    where: { id: Number(goalId), userId }
  });

  if (!goal) return null;

  const newStatus = !goal.completed;
  return prisma.dailyGoal.update({
    where: { id: goal.id },
    data: {
      completed: newStatus,
      completedAt: newStatus ? new Date() : null
    }
  });
}

export async function deleteGoal(goalId, userId) {
  return prisma.dailyGoal.deleteMany({
    where: { id: Number(goalId), userId }
  });
}
