import { prisma } from '../database/prisma.js';

export async function checkHealth() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = `unhealthy: ${error.message}`;
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  return {
    status: dbStatus === 'healthy' ? 'ok' : 'degraded',
    uptimeSeconds,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs
    },
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024)
    },
    checkDurationMs: Date.now() - startTime
  };
}
