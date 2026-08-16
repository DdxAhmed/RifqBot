import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

// In-memory cache for prayer times: key = `${city}_${dateString}`, value = { timings, cachedAt }
const cache = new Map();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const DEFAULT_PRAYER_API = 'https://api.aladhan.com/v1/timingsByCity';

/**
 * Fetches prayer times for a city with caching and fallback.
 * @param {string} [city='Riyadh']
 * @param {string} [country='Saudi Arabia']
 * @returns {Promise<{ Fajr: string, Dhuhr: string, Asr: string, Maghrib: string, Isha: string, Sunrise: string } | null>}
 */
export async function getPrayerTimes(city = 'Riyadh', country = 'Saudi Arabia') {
  const dateStr = new Date().toISOString().slice(0, 10);
  const cacheKey = `${city.toLowerCase()}_${country.toLowerCase()}_${dateStr}`;

  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
    return cached.timings;
  }

  const baseUrl = env.PRAYER_API_URL || DEFAULT_PRAYER_API;
  const url = `${baseUrl}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=4`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      logger.warn(`Prayer API responded with status ${res.status}`);
      return null;
    }

    const json = await res.json();
    if (json.data && json.data.timings) {
      const timings = {
        Fajr: json.data.timings.Fajr,
        Sunrise: json.data.timings.Sunrise,
        Dhuhr: json.data.timings.Dhuhr,
        Asr: json.data.timings.Asr,
        Maghrib: json.data.timings.Maghrib,
        Isha: json.data.timings.Isha
      };
      cache.set(cacheKey, { timings, cachedAt: Date.now() });
      return timings;
    }
    return null;
  } catch (error) {
    logger.warn(`Prayer API unavailable: ${error.message}`);
    return null;
  }
}
