import { prisma } from '../database/prisma.js';

export async function addNote(userId, content) {
  return prisma.note.create({
    data: {
      userId,
      content
    }
  });
}

export async function listNotes(userId, { limit = 10, page = 1 } = {}) {
  const skip = (page - 1) * limit;
  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.note.count({ where: { userId } })
  ]);

  return {
    notes,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1
  };
}

export async function searchNotes(userId, query, limit = 10) {
  return prisma.note.findMany({
    where: {
      userId,
      content: {
        contains: query,
        mode: 'insensitive'
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function deleteNote(id, userId) {
  return prisma.note.deleteMany({
    where: { id: Number(id), userId }
  });
}
