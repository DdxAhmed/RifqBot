import test from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';

function simulateStreakUpdate(streak, todayDt, zone = 'Asia/Riyadh') {
  if (streak.lastDate) {
    const lastDt = DateTime.fromJSDate(streak.lastDate).setZone(zone);
    const diffDays = Math.floor(todayDt.diff(lastDt, 'days').days);

    if (diffDays === 0) {
      return streak;
    }

    if (diffDays === 1) {
      const newCurrent = streak.current + 1;
      return {
        current: newCurrent,
        longest: Math.max(streak.longest, newCurrent),
        lastDate: todayDt.toJSDate()
      };
    }

    return {
      current: 1,
      longest: Math.max(streak.longest, 1),
      lastDate: todayDt.toJSDate()
    };
  }

  return {
    current: 1,
    longest: 1,
    lastDate: todayDt.toJSDate()
  };
}

test('Streak Logic - first activity starts streak at 1', () => {
  const today = DateTime.fromISO('2026-08-16T12:00:00', { zone: 'Asia/Riyadh' });
  const initial = { current: 0, longest: 0, lastDate: null };
  const updated = simulateStreakUpdate(initial, today);
  assert.strictEqual(updated.current, 1);
  assert.strictEqual(updated.longest, 1);
});

test('Streak Logic - second activity on same day does not increment', () => {
  const today = DateTime.fromISO('2026-08-16T12:00:00', { zone: 'Asia/Riyadh' });
  const initial = { current: 3, longest: 5, lastDate: today.toJSDate() };
  const updated = simulateStreakUpdate(initial, today);
  assert.strictEqual(updated.current, 3);
  assert.strictEqual(updated.longest, 5);
});

test('Streak Logic - activity on next consecutive day increments streak', () => {
  const yesterday = DateTime.fromISO('2026-08-15T12:00:00', { zone: 'Asia/Riyadh' });
  const today = DateTime.fromISO('2026-08-16T12:00:00', { zone: 'Asia/Riyadh' });
  const initial = { current: 4, longest: 4, lastDate: yesterday.toJSDate() };
  const updated = simulateStreakUpdate(initial, today);
  assert.strictEqual(updated.current, 5);
  assert.strictEqual(updated.longest, 5);
});

test('Streak Logic - missed day resets streak to 1 while preserving longest', () => {
  const threeDaysAgo = DateTime.fromISO('2026-08-13T12:00:00', { zone: 'Asia/Riyadh' });
  const today = DateTime.fromISO('2026-08-16T12:00:00', { zone: 'Asia/Riyadh' });
  const initial = { current: 10, longest: 10, lastDate: threeDaysAgo.toJSDate() };
  const updated = simulateStreakUpdate(initial, today);
  assert.strictEqual(updated.current, 1);
  assert.strictEqual(updated.longest, 10);
});
