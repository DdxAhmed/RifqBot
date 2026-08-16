import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDateTimeInput,
  sanitizeText,
  parsePositiveInt
} from '../src/utils/validation.js';

test('Validation - parses relative minute input (بعد 15 دقيقة)', () => {
  const result = parseDateTimeInput('بعد 15 دقيقة');
  assert.ok(result instanceof Date);
  const diffMins = Math.round((result.getTime() - Date.now()) / 60000);
  assert.strictEqual(diffMins, 15);
});

test('Validation - parses relative hour input (بعد ساعتين)', () => {
  const result = parseDateTimeInput('بعد ساعتين');
  assert.ok(result instanceof Date);
  const diffHours = Math.round((result.getTime() - Date.now()) / 3600000);
  assert.strictEqual(diffHours, 2);
});

test('Validation - parses HH:mm format (20:30)', () => {
  const result = parseDateTimeInput('20:30', 'Asia/Riyadh');
  assert.ok(result instanceof Date);
  assert.ok(result.getTime() > Date.now() - 1000);
});

test('Validation - parses tomorrow format (غدا 10:00)', () => {
  const result = parseDateTimeInput('غدا 10:00', 'Asia/Riyadh');
  assert.ok(result instanceof Date);
  assert.ok(result.getTime() > Date.now());
});

test('Validation - returns null for invalid date input', () => {
  assert.strictEqual(parseDateTimeInput('نص عشوائي غير مفهوم'), null);
  assert.strictEqual(parseDateTimeInput(''), null);
  assert.strictEqual(parseDateTimeInput(null), null);
});

test('Validation - sanitizeText trims and caps length', () => {
  const input = '   أهلا وسهلا   ';
  assert.strictEqual(sanitizeText(input), 'أهلا وسهلا');
  assert.strictEqual(sanitizeText('1234567890', 5), '12345');
});

test('Validation - parsePositiveInt parses positive numbers and rejects invalid', () => {
  assert.strictEqual(parsePositiveInt('42'), 42);
  assert.strictEqual(parsePositiveInt('-5', 0), 0);
  assert.strictEqual(parsePositiveInt('abc', 1), 1);
});
