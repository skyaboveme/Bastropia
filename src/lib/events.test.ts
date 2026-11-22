import assert from 'node:assert/strict';
import test from 'node:test';
import { dedupeListings, eventsInWindow, listWindow, type ListedEvent } from './events.ts';

function event(overrides: Partial<ListedEvent['data']> & { id?: string } = {}): ListedEvent {
  const { id = 'market', ...data } = overrides;
  return {
    id,
    collection: 'events',
    data: {
      title: 'Market',
      summary: 'Short note',
      start: new Date('2026-11-22T18:00:00Z'),
      schedule: 'timed',
      city: 'Bastrop',
      venue: 'Fisherman Park',
      category: 'markets',
      cost: 'Free',
      tier: 'community',
      ...data,
    },
  } as ListedEvent;
}

test('dedupe keeps the fuller listing and a different venue', () => {
  const thin = event({ id: 'thin', summary: 'Short note' });
  const full = event({
    id: 'full',
    summary: 'Food stalls along the river with live music all morning.',
  });
  const other = event({
    id: 'library',
    title: 'Market',
    summary: 'Books',
    venue: 'Public Library',
  });
  const kept = dedupeListings([thin, full, other]);
  assert.deepEqual(kept.map((item) => item.id), ['full', 'library']);
});

test('dedupe of a few hundred distinct listings stays well under a second', () => {
  const events = Array.from({ length: 400 }, (_, index) =>
    event({
      id: `event-${index}`,
      title: `Listing ${index}`,
      start: new Date(Date.UTC(2026, 10, 22, 12, index % 50)),
      venue: `Venue ${index}`,
    }),
  );
  const started = performance.now();
  const kept = dedupeListings(events);
  const elapsed = performance.now() - started;
  assert.equal(kept.length, 400);
  assert.ok(elapsed < 1000, `dedupe took ${elapsed.toFixed(0)}ms`);
});

test('a list page is 45 days and the next page continues', () => {
  const first = listWindow(1, '2026-11-22');
  const second = listWindow(2, '2026-11-22');
  assert.equal(first.start, '2026-11-22');
  assert.equal(first.end, '2027-01-06');
  assert.equal(second.start, '2027-01-06');
  assert.equal(second.end, '2027-02-20');

  const early = event({ id: 'early', start: new Date('2026-11-22T18:00:00-06:00') });
  const late = event({ id: 'late', title: 'Later', start: new Date('2027-02-01T18:00:00-06:00') });
  assert.deepEqual(eventsInWindow([early, late], first.start, first.end).map((item) => item.id), ['early']);
  assert.deepEqual(eventsInWindow([early, late], second.start, second.end).map((item) => item.id), ['late']);
});
