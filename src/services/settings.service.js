import { prisma } from '../database/prisma.js';

export async function getUserSettings(userId) {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId }
    });
  }
  return settings;
}

export async function updateUserSettings(userId, updates) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: updates,
    create: { userId, ...updates }
  });
}

export async function toggleSetting(userId, settingKey) {
  const settings = await getUserSettings(userId);
  const currentVal = !!settings[settingKey];
  return updateUserSettings(userId, { [settingKey]: !currentVal });
}
