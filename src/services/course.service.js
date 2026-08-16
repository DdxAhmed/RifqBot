import { prisma } from '../database/prisma.js';
import { DateTime } from 'luxon';
import { DEFAULT_TIMEZONE } from '../utils/timezone.js';

export function calculateCoursePace(course, completedCount, zone = DEFAULT_TIMEZONE) {
  const total = Math.max(course.lessons?.length || 0, course.totalLessons || 0);
  const remainingLessons = Math.max(0, total - completedCount);
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  let paceInfo = null;

  if (course.targetCompletionDate && remainingLessons > 0) {
    const nowInZone = DateTime.now().setZone(zone).startOf('day');
    const targetInZone = DateTime.fromJSDate(course.targetCompletionDate).setZone(zone).startOf('day');
    const daysRemaining = Math.max(1, Math.ceil(targetInZone.diff(nowInZone, 'days').days));

    if (daysRemaining <= 0 || targetInZone < nowInZone) {
      paceInfo = {
        daysRemaining: 0,
        requiredLessonsPerDay: remainingLessons,
        isBehindSchedule: true,
        targetDateFormatted: targetInZone.setLocale('ar').toFormat('d LLLL yyyy')
      };
    } else {
      const required = Math.ceil(remainingLessons / daysRemaining);
      paceInfo = {
        daysRemaining,
        requiredLessonsPerDay: required,
        isBehindSchedule: false,
        targetDateFormatted: targetInZone.setLocale('ar').toFormat('d LLLL yyyy')
      };
    }
  }

  return {
    total,
    completed: completedCount,
    remaining: remainingLessons,
    percent,
    paceInfo
  };
}

export async function createCourse(userId, { title, totalLessons = 0, targetCompletionDate = null, description = null }) {
  const course = await prisma.course.create({
    data: {
      userId,
      title,
      totalLessons: Number(totalLessons) || 0,
      targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : null,
      description
    }
  });

  // Automatically generate empty lesson slots if totalLessons is provided
  if (totalLessons > 0) {
    const lessonsData = Array.from({ length: totalLessons }, (_, i) => ({
      courseId: course.id,
      number: i + 1,
      title: `الدرس ${i + 1}`,
      completed: false
    }));
    await prisma.lesson.createMany({ data: lessonsData });
  }

  return course;
}

export async function listUserCourses(userId, zone = DEFAULT_TIMEZONE) {
  const courses = await prisma.course.findMany({
    where: { userId },
    include: {
      lessons: { orderBy: { number: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return courses.map((course) => {
    const completedCount = course.lessons.filter((l) => l.completed).length;
    const progress = calculateCoursePace(course, completedCount, zone);
    const nextUnfinished = course.lessons.find((l) => !l.completed) || null;
    return {
      ...course,
      progress,
      nextUnfinished
    };
  });
}

export async function getCourseDetails(courseId, userId, zone = DEFAULT_TIMEZONE) {
  const course = await prisma.course.findFirst({
    where: { id: Number(courseId), userId },
    include: {
      lessons: { orderBy: { number: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!course) return null;

  const completedCount = course.lessons.filter((l) => l.completed).length;
  const progress = calculateCoursePace(course, completedCount, zone);
  const nextUnfinished = course.lessons.find((l) => !l.completed) || null;

  return {
    ...course,
    progress,
    nextUnfinished
  };
}

export async function addLessonToCourse(courseId, userId, { title, number, duration = null, notes = null }) {
  const course = await prisma.course.findFirst({ where: { id: Number(courseId), userId } });
  if (!course) return null;

  const count = await prisma.lesson.count({ where: { courseId: course.id } });
  const lessonNumber = number || count + 1;

  const lesson = await prisma.lesson.create({
    data: {
      courseId: course.id,
      number: lessonNumber,
      title: title || `الدرس ${lessonNumber}`,
      duration,
      notes,
      completed: false
    }
  });

  await prisma.course.update({
    where: { id: course.id },
    data: { totalLessons: Math.max(course.totalLessons, lessonNumber) }
  });

  return lesson;
}

export async function toggleLessonCompletion(courseId, lessonNumber, userId) {
  const course = await prisma.course.findFirst({ where: { id: Number(courseId), userId } });
  if (!course) return null;

  const lesson = await prisma.lesson.findUnique({
    where: {
      courseId_number: {
        courseId: course.id,
        number: Number(lessonNumber)
      }
    }
  });

  if (!lesson) return null;

  const newStatus = !lesson.completed;
  const updatedLesson = await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      completed: newStatus,
      completedAt: newStatus ? new Date() : null
    }
  });

  return { course, lesson: updatedLesson };
}

export async function addCourseNote(courseId, userId, content) {
  const course = await prisma.course.findFirst({ where: { id: Number(courseId), userId } });
  if (!course) return null;

  return prisma.courseNote.create({
    data: {
      courseId: course.id,
      content
    }
  });
}

export async function deleteCourse(courseId, userId) {
  return prisma.course.deleteMany({
    where: { id: Number(courseId), userId }
  });
}
