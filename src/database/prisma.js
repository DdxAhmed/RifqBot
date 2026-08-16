import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }]
});
prisma.$on('error', (event) => console.error('[ERROR] Prisma', event.message));
prisma.$on('warn', (event) => console.warn('[WARN] Prisma', event.message));

export async function connectDatabase() {
  let attempts = 0;
  while (attempts < 5) {
    try {
      attempts++;
      await prisma.$connect();
      console.info('[INFO] Database connected');
      return;
    } catch (err) {
      if (attempts >= 5) {
        throw err;
      }
      console.warn(`[WARN] Database connection attempt ${attempts} failed (${err.message}). Retrying in 2s...`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
