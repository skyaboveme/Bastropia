import assert from 'node:assert/strict';
import test from 'node:test';
import { moonPhaseName, moonReading } from './moon.ts';

test('the November 2026 full moon is full at the published instant', () => {
  // timeanddate and USNO: 2026-11-24 14:53 UTC.
  const reading = moonReading(new Date('2026-11-24T14:53:00Z'));
  assert.equal(reading.name, 'Full moon');
  assert.ok(reading.fraction > 0.98);
  assert.equal(reading.percent, 100);
});

test('the December 2026 new moon is new at the published instant', () => {
  // USNO: 2026-12-09 00:52 UTC (still Dec 8 evening in Chicago).
  const reading = moonReading(new Date('2026-12-09T00:52:00Z'));
  assert.equal(reading.name, 'New moon');
  assert.ok(reading.fraction < 0.02);
});

test('quarter instants land on the quarter names', () => {
  assert.equal(moonReading(new Date('2026-11-17T11:47:00Z')).name, 'First quarter');
  assert.equal(moonReading(new Date('2026-12-01T06:08:00Z')).name, 'Last quarter');
});

test('phase names follow illumination and the waxing side', () => {
  assert.equal(moonPhaseName(0.1, 0.1), 'Waxing crescent');
  assert.equal(moonPhaseName(0.35, 0.8), 'Waxing gibbous');
  assert.equal(moonPhaseName(0.65, 0.8), 'Waning gibbous');
  assert.equal(moonPhaseName(0.9, 0.1), 'Waning crescent');
  assert.equal(moonPhaseName(0.25, 0.5), 'First quarter');
  assert.equal(moonPhaseName(0.75, 0.5), 'Last quarter');
  assert.equal(moonPhaseName(0.01, 0.01), 'New moon');
  assert.equal(moonPhaseName(0.5, 0.99), 'Full moon');
});

test('the lit path is an SVG path and the label includes the percent', () => {
  const reading = moonReading(new Date('2026-11-20T18:00:00Z'));
  assert.match(reading.litPath, /^M /);
  assert.match(reading.label, / · \d+%$/);
  assert.equal(reading.aria, `Moon: ${reading.name}, ${reading.percent}% illuminated`);
});
