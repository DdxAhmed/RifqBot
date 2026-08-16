import { listTodayReminders } from './reminder.service.js';
import { listTodayGoals } from './goals.service.js';
import { listUserCourses } from './course.service.js';
import { getTodayAdhkarStatus } from './adhkar.service.js';
import { getStreak } from './streak.service.js';
import { DEFAULT_TIMEZONE, formatArabicDate } from '../utils/timezone.js';

export async function generateDailyPlan(userId, zone = DEFAULT_TIMEZONE) {
  const [reminders, goals, courses, adhkar, streak] = await Promise.all([
    listTodayReminders(userId, zone),
    listTodayGoals(userId, zone),
    listUserCourses(userId, zone),
    getTodayAdhkarStatus(userId, zone),
    getStreak(userId)
  ]);

  const activeCoursesWithPace = courses
    .filter((c) => c.progress.remaining > 0)
    .map((c) => ({
      title: c.title,
      completed: c.progress.completed,
      total: c.progress.total,
      percent: c.progress.percent,
      nextUnfinished: c.nextUnfinished,
      pace: c.progress.paceInfo
    }));

  return {
    dateFormatted: formatArabicDate(new Date(), zone),
    reminders,
    goals,
    courses: activeCoursesWithPace,
    adhkar,
    streak: {
      current: streak?.current ?? 0,
      longest: streak?.longest ?? 0
    }
  };
}
