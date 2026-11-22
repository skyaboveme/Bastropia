import assert from 'node:assert/strict';
import test from 'node:test';
import { activeBanners } from './bannerSchedule.ts';

const banners = [
  { id: 'through-today', endDate: '2026-11-22' },
  { id: 'ended-yesterday', endDate: '2026-11-21' },
  { id: 'ongoing' },
  { id: 'later', endDate: '2026-12-01' },
  { id: 'not-a-day', endDate: 'November 15' },
];

test('a banner stays up through its Chicago end date and drops the next day', () => {
  const noon = new Date('2026-11-22T18:00:00Z');
  assert.deepEqual(
    activeBanners(banners, noon).map((banner) => banner.id),
    ['through-today', 'ongoing', 'later', 'not-a-day'],
  );
});

test('endDate is the last America/Chicago calendar day, not the UTC day', () => {
  const stillSunday = new Date('2026-11-16T05:59:00Z');
  const mondayMorning = new Date('2026-11-16T06:00:00Z');
  const unity = [{ id: 'community-unity-2026', endDate: '2026-11-15' }];
  assert.deepEqual(activeBanners(unity, stillSunday).map((banner) => banner.id), ['community-unity-2026']);
  assert.deepEqual(activeBanners(unity, mondayMorning), []);
});

test('an empty banner list stays empty', () => {
  assert.deepEqual(activeBanners([], new Date('2026-11-22T18:00:00Z')), []);
});
