import { prisma } from '../database/prisma.js';

export async function upsertUser(from) {
  const telegramId = BigInt(from.id);
  const firstName = from.first_name || null;

  return prisma.user.upsert({
    where: { telegramId },
    update: {
      firstName: firstName ?? undefined
    },
    create: {
      telegramId,
      firstName,
      settings: { create: {} },
      adhkarSettings: { create: {} },
      streak: { create: {} }
    },
    include: {
      settings: true,
      adhkarSettings: true,
      streak: true
    }
  });
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      settings: true,
      adhkarSettings: true,
      streak: true
    }
  });
}

export async function getUserByTelegramId(telegramId) {
  return prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    include: {
      settings: true,
      adhkarSettings: true,
      streak: true
    }
  });
}

export async function updateUserTimezone(userId, timezone) {
  return prisma.user.update({
    where: { id: userId },
    data: { timezone }
  });
}

export async function updateUserCity(userId, city) {
  return prisma.user.update({
    where: { id: userId },
    data: { city }
  });
}
