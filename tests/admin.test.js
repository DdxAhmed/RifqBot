process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';

test('Admin Auth - env.isAdmin identifies admin telegram IDs correctly', () => {
  assert.strictEqual(env.isAdmin('999999999999'), false);
  assert.strictEqual(env.isAdmin(null), false);
  assert.strictEqual(env.isAdmin(''), false);
});
