import { DateTime } from 'luxon';

export const DEFAULT_TIMEZONE = 'Asia/Riyadh';

export function getNowInZone(zone = DEFAULT_TIMEZONE) {
  return DateTime.now().setZone(zone);
}

export function toUserZone(date, zone = DEFAULT_TIMEZONE) {
  if (!date) return null;
  const jsDate = date instanceof Date ? date : new Date(date);
  return DateTime.fromJSDate(jsDate).setZone(zone);
}

export function toUtcDate(dateTime) {
  if (!dateTime) return null;
  if (dateTime instanceof Date) {
    return dateTime;
  }
  return dateTime.toUTC().toJSDate();
}

export function getDayBounds(zone = DEFAULT_TIMEZONE, referenceDate = new Date()) {
  const dt = DateTime.fromJSDate(referenceDate).setZone(zone);
  const start = dt.startOf('day').toUTC().toJSDate();
  const end = dt.endOf('day').toUTC().toJSDate();
  return { start, end };
}

export function getTodayDateOnly(zone = DEFAULT_TIMEZONE, referenceDate = new Date()) {
  const dt = DateTime.fromJSDate(referenceDate).setZone(zone);
  return dt.startOf('day').toUTC().toJSDate();
}

export function formatArabicTime(date, zone = DEFAULT_TIMEZONE) {
  if (!date) return '';
  const dt = toUserZone(date, zone);
  return dt.setLocale('ar').toFormat('hh:mm a');
}

export function formatArabicDate(date, zone = DEFAULT_TIMEZONE) {
  if (!date) return '';
  const dt = toUserZone(date, zone);
  return dt.setLocale('ar').toFormat('cccc d LLLL yyyy');
}

export function formatArabicDateTime(date, zone = DEFAULT_TIMEZONE) {
  if (!date) return '';
  const dt = toUserZone(date, zone);
  return dt.setLocale('ar').toFormat('d LLLL - hh:mm a');
}

/**
 * Calculates the next occurrence of a recurring reminder based on recurrence type and rule.
 * @param {string} recurrence - 'ONCE' | 'DAILY' | 'WEEKLY' | 'CUSTOM'
 * @param {Date} previousDueAt
 * @param {string} [zone='Asia/Riyadh']
 * @param {string} [recurrenceRule]
 * @returns {Date|null}
 */
export function calculateNextOccurrence(recurrence, previousDueAt, zone = DEFAULT_TIMEZONE, recurrenceRule = null) {
  if (recurrence === 'ONCE') {
    return null;
  }

  const prevDt = toUserZone(previousDueAt, zone);
  let nextDt = prevDt;
  const nowInZone = getNowInZone(zone);

  if (recurrence === 'DAILY') {
    nextDt = nextDt.plus({ days: 1 });
    while (nextDt <= nowInZone) {
      nextDt = nextDt.plus({ days: 1 });
    }
  } else if (recurrence === 'WEEKLY') {
    nextDt = nextDt.plus({ weeks: 1 });
    while (nextDt <= nowInZone) {
      nextDt = nextDt.plus({ weeks: 1 });
    }
  } else if (recurrence === 'CUSTOM' && recurrenceRule) {
    const days = parseInt(recurrenceRule, 10);
    const step = Number.isFinite(days) && days > 0 ? days : 1;
    nextDt = nextDt.plus({ days: step });
    while (nextDt <= nowInZone) {
      nextDt = nextDt.plus({ days: step });
    }
  } else {
    nextDt = nextDt.plus({ days: 1 });
  }

  return nextDt.toUTC().toJSDate();
}
