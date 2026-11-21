// Pure-logic tests for the day book's Bangladesh days and comparisons: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-expect-error -- node's test runner needs the .ts extension; tsc does not allow it
import { bdDayRange, bdToday, dayLabel, delta, parseDay, shiftDay } from '../lib/daybook.ts';

test('today in Bangladesh rolls over at 18:00 UTC', () => {
  assert.equal(bdToday(new Date('2026-11-21T17:59:00Z')), '2026-11-21');
  assert.equal(bdToday(new Date('2026-11-21T18:00:00Z')), '2026-11-22');
});

test('a Bangladesh day is [18:00 UTC the day before, 18:00 UTC)', () => {
  const { start, end } = bdDayRange('2026-11-21');
  assert.equal(start.toISOString(), '2026-11-20T18:00:00.000Z');
  assert.equal(end.toISOString(), '2026-11-21T18:00:00.000Z');
});

test('only real dates parse', () => {
  assert.equal(parseDay('2026-11-21'), '2026-11-21');
  assert.equal(parseDay('2026-02-30'), null);
  assert.equal(parseDay('21/11/2026'), null);
  assert.equal(parseDay(null), null);
});

test('shifting days crosses months and years', () => {
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
});

test('change against the day before', () => {
  assert.deepEqual(delta(150, 100), { diff: 50, pct: 50 });
  assert.deepEqual(delta(50, 100), { diff: -50, pct: -50 });
  assert.deepEqual(delta(10, 0), { diff: 10, pct: null });
  assert.deepEqual(delta(-20, -10), { diff: -10, pct: -100 });
});

test('day labels', () => {
  assert.equal(dayLabel('2026-11-21', '2026-11-21'), 'Today');
  assert.equal(dayLabel('2026-11-20', '2026-11-21'), 'Yesterday');
  assert.match(dayLabel('2026-11-18', '2026-11-21'), /Wed.*18.*Nov/);
});
