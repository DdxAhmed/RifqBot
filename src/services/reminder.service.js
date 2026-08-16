import { prisma } from '../database/prisma.js';
import { getDayBounds, calculateNextOccurrence, DEFAULT_TIMEZONE } from '../utils/timezone.js';

export async function createReminder(userId, { title, description = null, dueAt, recurrence = 'ONCE', recurrenceRule = null }) {
  return prisma.reminder.create({
    data: {
      userId,
      title,
      description,
      dueAt,
      recurrence,
      recurrenceRule,
      active: true
    }
  });
}

export async function getReminderById(id, userId) {
  const where = { id: Number(id) };
  if (userId) where.userId = userId;
  return prisma.reminder.findFirst({ where });
}

export async function listActiveReminders(userId) {
  return prisma.reminder.findMany({
    where: { userId, active: true },
    orderBy: { dueAt: 'asc' }
  });
}

export async function listTodayReminders(userId, zone = DEFAULT_TIMEZONE) {
  const { start, end } = getDayBounds(zone);
  return prisma.reminder.findMany({
    where: {
      userId,
      active: true,
      dueAt: { gte: start, lte: end }
    },
    orderBy: { dueAt: 'asc' }
  });
}

export async function fetchDueReminders(now = new Date(), limit = 100) {
  return prisma.reminder.findMany({
    where: {
      active: true,
      dueAt: { lte: now }
    },
    include: {
      user: true
    },
    take: limit
  });
}

/**
 * Atomically claims a reminder for execution so concurrent workers don't execute it twice.
 */
export async function claimReminder(reminderId) {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const result = await prisma.reminder.updateMany({
    where: {
      id: reminderId,
      active: true,
      OR: [
        { lastTriggeredAt: null },
        { lastTriggeredAt: { lt: oneMinuteAgo } }
      ]
    },
    data: {
      lastTriggeredAt: new Date()
    }
  });
  return result.count === 1;
}

/**
 * Handles post-execution recurrence advancement or deactivation.
 */
export async function completeOrAdvanceReminder(reminder) {
  if (reminder.recurrence === 'ONCE') {
    return prisma.reminder.update({
      where: { id: reminder.id },
      data: { active: false }
    });
  }

  const nextDue = calculateNextOccurrence(
    reminder.recurrence,
    reminder.dueAt,
    reminder.user?.timezone || DEFAULT_TIMEZONE,
    reminder.recurrenceRule
  );

  if (nextDue) {
    return prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        dueAt: nextDue,
        active: true
      }
    });
  }

  return prisma.reminder.update({
    where: { id: reminder.id },
    data: { active: false }
  });
}

export async function markReminderDone(id, userId) {
  return prisma.reminder.updateMany({
    where: { id: Number(id), userId },
    data: {
      active: false,
      completedAt: new Date()
    }
  });
}

export async function snoozeReminder(id, userId, minutes = 10) {
  const newDue = new Date(Date.now() + minutes * 60_000);
  return prisma.reminder.updateMany({
    where: { id: Number(id), userId },
    data: {
      dueAt: newDue,
      active: true
    }
  });
}

export async function deleteReminder(id, userId) {
  return prisma.reminder.deleteMany({
    where: { id: Number(id), userId }
  });
}

export async function toggleReminderActive(id, userId) {
  const reminder = await prisma.reminder.findFirst({ where: { id: Number(id), userId } });
  if (!reminder) return null;
  return prisma.reminder.update({
    where: { id: reminder.id },
    data: { active: !reminder.active }
  });
}
