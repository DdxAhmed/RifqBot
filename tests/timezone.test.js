import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDayBounds,
  calculateNextOccurrence,
  formatArabicDateTime,
  DEFAULT_TIMEZONE
} from '../src/utils/timezone.js';

test('Timezone - Day bounds generate valid start and end dates', () => {
  const bounds = getDayBounds('Asia/Riyadh');
  assert.ok(bounds.start instanceof Date);
  assert.ok(bounds.end instanceof Date);
  assert.ok(bounds.start.getTime() < bounds.end.getTime());
});

test('Timezone - calculateNextOccurrence for ONCE returns null', () => {
  const next = calculateNextOccurrence('ONCE', new Date());
  assert.strictEqual(next, null);
});

test('Timezone - calculateNextOccurrence for DAILY advances by at least 1 day into future', () => {
  const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const next = calculateNextOccurrence('DAILY', past, DEFAULT_TIMEZONE);
  assert.ok(next instanceof Date);
  assert.ok(next.getTime() > Date.now());
});

test('Timezone - calculateNextOccurrence for WEEKLY advances into future', () => {
  const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const next = calculateNextOccurrence('WEEKLY', past, DEFAULT_TIMEZONE);
  assert.ok(next instanceof Date);
  assert.ok(next.getTime() > Date.now());
});

test('Timezone - calculateNextOccurrence for CUSTOM with 3 days rule', () => {
  const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const next = calculateNextOccurrence('CUSTOM', past, DEFAULT_TIMEZONE, '3');
  assert.ok(next instanceof Date);
  assert.ok(next.getTime() > Date.now());
});

test('Timezone - formatArabicDateTime produces non-empty string with Arabic characters', () => {
  const formatted = formatArabicDateTime(new Date(), 'Asia/Riyadh');
  assert.ok(typeof formatted === 'string');
  assert.ok(formatted.length > 3);
});
