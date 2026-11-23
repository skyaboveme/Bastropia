import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDollars, formatHead, formatWeek, sharePercent } from './cattle.ts';

test('headlines round the way the cattle report speaks', () => {
  assert.equal(formatHead(86155300), '86.2 million');
  assert.equal(formatHead(12100000), '12.1 million');
  assert.equal(formatHead(4045000), '4.05 million');
  assert.equal(formatHead(9568300), '9.57 million');
  assert.equal(formatHead(46801), '46,801');
});

test('dollars and shares stay with the published scale', () => {
  assert.equal(formatDollars(26989000), '$26.99 million');
  assert.equal(formatDollars(15667360000), '$15.67 billion');
  assert.equal(sharePercent(12100000, 86155300), '14.0%');
  assert.equal(sharePercent(46801, 12543300), '0.37%');
  assert.equal(sharePercent(1, 0), null);
});

test('a feeder week reads as a range', () => {
  assert.equal(formatWeek('2026-11-15/2026-11-21'), 'Nov 15–21, 2026');
});
