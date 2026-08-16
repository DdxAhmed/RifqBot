import test from 'node:test';
import assert from 'node:assert/strict';
import { MORNING_ADHKAR, EVENING_ADHKAR } from '../src/data/adhkar.data.js';
import { getAdhkarSessionState } from '../src/services/adhkar.service.js';

test('Adhkar Data - morning and evening datasets have valid content and references', () => {
  assert.ok(MORNING_ADHKAR.length >= 5);
  assert.ok(EVENING_ADHKAR.length >= 5);

  for (const item of [...MORNING_ADHKAR, ...EVENING_ADHKAR]) {
    assert.ok(item.id);
    assert.ok(typeof item.text === 'string' && item.text.length > 5);
    assert.ok(typeof item.count === 'number' && item.count >= 1);
    assert.ok(typeof item.reference === 'string' && item.reference.length > 2);
  }
});

test('Adhkar Service - session state navigation boundary checks', () => {
  const firstState = getAdhkarSessionState('morning', 0);
  assert.strictEqual(firstState.isFirst, true);
  assert.strictEqual(firstState.isLast, false);
  assert.strictEqual(firstState.index, 0);

  const lastIndex = MORNING_ADHKAR.length - 1;
  const lastState = getAdhkarSessionState('morning', lastIndex);
  assert.strictEqual(lastState.isFirst, false);
  assert.strictEqual(lastState.isLast, true);
  assert.strictEqual(lastState.index, lastIndex);
});
