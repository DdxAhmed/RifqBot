import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCoursePace } from '../src/services/course.service.js';
import { DateTime } from 'luxon';

test('Course Service - calculates progress percentage correctly', () => {
  const course = {
    totalLessons: 20,
    lessons: Array.from({ length: 20 }, (_, i) => ({ completed: i < 5 }))
  };

  const progress = calculateCoursePace(course, 5, 'Asia/Riyadh');
  assert.strictEqual(progress.total, 20);
  assert.strictEqual(progress.completed, 5);
  assert.strictEqual(progress.remaining, 15);
  assert.strictEqual(progress.percent, 25);
  assert.strictEqual(progress.paceInfo, null);
});

test('Course Service - calculates daily pace when target completion date is set', () => {
  const futureDate = DateTime.now().setZone('Asia/Riyadh').plus({ days: 10 }).toJSDate();
  const course = {
    totalLessons: 30,
    targetCompletionDate: futureDate,
    lessons: Array.from({ length: 30 }, (_, i) => ({ completed: i < 10 }))
  };

  const progress = calculateCoursePace(course, 10, 'Asia/Riyadh');
  assert.strictEqual(progress.completed, 10);
  assert.strictEqual(progress.remaining, 20);
  assert.strictEqual(progress.percent, 33);
  assert.ok(progress.paceInfo !== null);
  assert.strictEqual(progress.paceInfo.requiredLessonsPerDay, 2);
  assert.strictEqual(progress.paceInfo.isBehindSchedule, false);
});

test('Course Service - flags behind schedule when target date has passed', () => {
  const pastDate = DateTime.now().setZone('Asia/Riyadh').minus({ days: 2 }).toJSDate();
  const course = {
    totalLessons: 10,
    targetCompletionDate: pastDate,
    lessons: Array.from({ length: 10 }, () => ({ completed: false }))
  };

  const progress = calculateCoursePace(course, 0, 'Asia/Riyadh');
  assert.strictEqual(progress.remaining, 10);
  assert.ok(progress.paceInfo.isBehindSchedule);
  assert.strictEqual(progress.paceInfo.requiredLessonsPerDay, 10);
});
