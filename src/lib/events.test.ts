import assert from 'node:assert/strict';
import test from 'node:test';
import { dedupeListings, sliceEventWindow, type ListedEvent } from './events.ts';

function item(id: string, data: Partial<ListedEvent['data']> = {}): ListedEvent {
  return {
    id,
    collection: 'events',
    data: {
      title: 'Market',
      summary: 'Short',
      start: new Date('2026-12-05T18:00:00-06:00'),
      schedule: 'timed',
      city: 'Bastrop',
      venue: "Fisherman's Park",
      category: 'markets',
      cost: 'Free',
      tier: 'community',
      ...data,
    },
  } as ListedEvent;
}

test('duplicate gatherings collapse to the fuller listing', () => {
  const kept = dedupeListings([
    item('a', { summary: 'Short' }),
    item('b', { summary: 'A longer note about the market stalls and the music.' }),
  ]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0]?.id, 'b');
});

test('the same title at another place or hour stays', () => {
  const kept = dedupeListings([
    item('a', { venue: 'Library' }),
    item('b', { venue: 'River Park' }),
    item('c', { start: new Date('2026-12-05T20:00:00-06:00') }),
  ]);
  assert.deepEqual(
    kept.map((event) => event.id),
    ['a', 'b', 'c'],
  );
});

test('a window keeps the next 45 days and points at the following day', () => {
  const events = ['2026-11-22', '2026-12-01', '2027-01-05', '2027-01-06', '2027-02-01'];
  const first = sliceEventWindow(events, '2026-11-22', (day) => day, 45);
  assert.deepEqual(first.shown, ['2026-11-22', '2026-12-01', '2027-01-05']);
  assert.equal(first.moreAfter, '2027-01-06');
  const next = sliceEventWindow(events, first.moreAfter ?? '', (day) => day, 45);
  assert.deepEqual(next.shown, ['2027-01-06', '2027-02-01']);
  assert.equal(next.moreAfter, null);
});
