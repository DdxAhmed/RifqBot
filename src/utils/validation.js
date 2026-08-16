import { DateTime } from 'luxon';
import { DEFAULT_TIMEZONE } from './timezone.js';

/**
 * Parses user input for time or relative offsets.
 * Supports:
 * - "20:00", "8:30", "08:30"
 * - "بعد ساعة", "بعد 30 دقيقة", "بعد ساعتين"
 * - "غدا 10:00", "بكرة 15:30"
 * @param {string} text
 * @param {string} zone
 * @returns {Date|null}
 */
export function parseDateTimeInput(text, zone = DEFAULT_TIMEZONE) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim();
  const now = DateTime.now().setZone(zone);

  // Match relative minutes: "بعد 15 دقيقة", "بعد 10 دقائق"
  const relMinMatch = cleaned.match(/^بعد\s+(\d+)\s*(دقيقة|دقائق|د)/i);
  if (relMinMatch) {
    const mins = parseInt(relMinMatch[1], 10);
    return now.plus({ minutes: mins }).toUTC().toJSDate();
  }

  // Match relative hours: "بعد ساعتين", "بعد ساعة", "بعد 3 ساعات"
  if (/^بعد\s+ساعة/i.test(cleaned)) {
    return now.plus({ hours: 1 }).toUTC().toJSDate();
  }
  if (/^بعد\s+ساعتين/i.test(cleaned)) {
    return now.plus({ hours: 2 }).toUTC().toJSDate();
  }
  const relHourMatch = cleaned.match(/^بعد\s+(\d+)\s*(ساعة|ساعات)/i);
  if (relHourMatch) {
    const hours = parseInt(relHourMatch[1], 10);
    return now.plus({ hours }).toUTC().toJSDate();
  }

  // Match "غدا HH:mm" or "بكرة HH:mm"
  const tomorrowMatch = cleaned.match(/^(غدا|غداً|بكرة|بكره)\s+(\d{1,2}):(\d{2})$/i);
  if (tomorrowMatch) {
    const hour = parseInt(tomorrowMatch[2], 10);
    const minute = parseInt(tomorrowMatch[3], 10);
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      return now.plus({ days: 1 }).set({ hour, minute, second: 0, millisecond: 0 }).toUTC().toJSDate();
    }
  }

  // Match "HH:mm" (24-hour format)
  const timeMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      let target = now.set({ hour, minute, second: 0, millisecond: 0 });
      // If the time already passed today, schedule for tomorrow
      if (target <= now) {
        target = target.plus({ days: 1 });
      }
      return target.toUTC().toJSDate();
    }
  }

  return null;
}

export function sanitizeText(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}

export function parsePositiveInt(val, fallback = null) {
  const num = parseInt(val, 10);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}
