import assert from 'node:assert/strict';
import test from 'node:test';
import type { ListedEvent } from './events.ts';
import {
  BCC_EVENTS_FEED,
  BCC_EVENTS_KV_KEY,
  chicagoWallToDate,
  eventHref,
  mapCategory,
  mapTier,
  mapTown,
  parsePublicFeed,
  readCachedBccEvents,
  redirectForLegacyEvent,
  refreshBccEvents,
  runWithEventsSource,
  toListedEvents,
  type BccPublicEvent,
} from './eventSource.ts';
import { eventKey } from './time.ts';

function bcc(overrides: Partial<BccPublicEvent> = {}): BccPublicEvent {
  return {
    id: 'evt_1',
    slug: 'county-festival',
    url: 'https://bastropcountycalendar.com/events/county-festival',
    title: 'County Festival',
    summary: 'Food stalls along the river.',
    description: 'Food stalls stay open across three evenings along the river.',
    start: '2026-12-05T18:00:00',
    end: '2026-12-05T21:00:00',
    allDay: false,
    recurrence: 'none',
    venue: 'Fisherman\'s Park',
    address: '1200 Willow St, Bastrop, TX',
    locationUrl: null,
    town: 'Bastrop',
    category: 'food-drink',
    categoryKey: 'food',
    tags: [],
    cost: null,
    image: 'https://bastropcountycalendar.com/images/festival.jpg',
    eventUrl: null,
    tier: 'free',
    featured: false,
    pinned: false,
    status: 'active',
    updatedAt: '2026-11-21T08:00:00Z',
    ...overrides,
  };
}

function local(overrides: Partial<ListedEvent['data']> & { id?: string } = {}): ListedEvent {
  const { id = 'alive-after-five-2026-11-12', ...data } = overrides;
  return {
    id,
    collection: 'events',
    data: {
      title: 'Alive After Five',
      summary: 'After-work networking.',
      start: new Date('2026-11-12T17:30:00-06:00'),
      end: new Date('2026-11-12T19:00:00-06:00'),
      schedule: 'timed',
      city: 'Bastrop',
      venue: 'Main Street',
      category: 'community',
      cost: 'See the listing',
      tier: 'community',
      ...data,
    },
  } as ListedEvent;
}

test('categoryKey maps onto Bastropia categories', () => {
  assert.equal(mapCategory('food'), 'food');
  assert.equal(mapCategory('family'), 'family');
  assert.equal(mapCategory('outdoors'), 'outdoors');
  assert.equal(mapCategory('civic'), 'government');
  assert.equal(mapCategory('faith'), 'community');
  assert.equal(mapCategory('markets'), 'markets');
  assert.equal(mapCategory('not-a-real-key'), 'community');
});

test('towns outside the county list become Countywide', () => {
  assert.equal(mapTown('Elgin'), 'Elgin');
  assert.equal(mapTown('cedar creek'), 'Cedar Creek');
  assert.equal(mapTown(''), 'Countywide');
  assert.equal(mapTown('Red Rock'), 'Red Rock');
  assert.equal(mapTown('Austin'), 'Countywide');
});

test('tier, featured, and pinned map onto Bastropia tiers', () => {
  assert.equal(mapTier({ tier: 'free' }), 'community');
  assert.equal(mapTier({ tier: 'featured' }), 'spotlight');
  assert.equal(mapTier({ tier: 'featured', featured: true }), 'featured');
  assert.equal(mapTier({ tier: 'sponsored' }), 'featured');
  assert.equal(mapTier({ tier: 'premium' }), 'featured');
  assert.equal(mapTier({ tier: 'free', pinned: true }), 'featured');
  assert.equal(mapTier({ tier: 'something-else' }), 'community');
});

test('naive feed times stay on the Chicago calendar day', () => {
  const winter = chicagoWallToDate('2026-11-21T18:00:00');
  assert.ok(winter);
  assert.equal(eventKey(winter!), '2026-11-21');
  const summer = chicagoWallToDate('2026-07-04T18:00:00');
  assert.ok(summer);
  assert.equal(eventKey(summer!), '2026-07-04');
  const listed = toListedEvents([bcc()]);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, 'county-festival');
  assert.equal(listed[0].data.category, 'food');
  assert.equal(listed[0].data.city, 'Bastrop');
  assert.equal(listed[0].data.tier, 'community');
  assert.equal(listed[0].data.cost, 'See the listing');
  assert.equal(listed[0].data.sourceUrl, 'https://bastropcountycalendar.com/events/county-festival');
  assert.equal(listed[0].data.sourceLabel, 'Bastrop County Calendar');
  assert.equal(eventHref(listed[0], 'bcc'), listed[0].data.sourceUrl);
  assert.equal(eventHref(listed[0], 'local'), '/events/county-festival');
});

test('an unknown town and a cancelled row do not become a local listing', () => {
  const listed = toListedEvents([
    bcc({
      id: 'evt_wide',
      slug: 'countywide-market',
      url: 'https://bastropcountycalendar.com/events/countywide-market',
      title: 'Countywide Market',
      town: 'Austin',
      venue: '',
      categoryKey: 'markets',
      tier: 'featured',
      featured: false,
      pinned: false,
    }),
    bcc({
      id: 'evt_cancelled',
      slug: 'called-off',
      url: 'https://bastropcountycalendar.com/events/called-off',
      title: 'Called Off',
      status: 'cancelled',
    }),
  ]);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].data.city, 'Countywide');
  assert.equal(listed[0].data.venue, 'Bastrop County');
  assert.equal(listed[0].data.tier, 'spotlight');
});

test('legacy urls match source, slug, or title and date', () => {
  const events = [
    bcc({
      id: 'evt_alive',
      slug: 'alive-after-five',
      url: 'https://bastropcountycalendar.com/events/alive-after-five',
      title: 'Alive After Five',
      start: '2026-11-12T17:30:00',
      end: '2026-11-12T19:00:00',
      town: 'Bastrop',
    }),
    bcc({
      id: 'evt_linked',
      slug: 'chamber-breakfast',
      url: 'https://bastropcountycalendar.com/events/chamber-breakfast',
      title: 'Chamber Breakfast',
      start: '2026-12-01T08:00:00',
    }),
  ];
  const bySlug = redirectForLegacyEvent('alive-after-five-2026-11-12', local(), events, new Date('2026-11-01T15:00:00Z'));
  assert.equal(bySlug, 'https://bastropcountycalendar.com/events/alive-after-five');

  const bySource = redirectForLegacyEvent(
    'breakfast-2026-12-01',
    local({
      id: 'breakfast-2026-12-01',
      title: 'A different headline',
      start: new Date('2026-12-01T08:00:00-06:00'),
      sourceUrl: 'https://bastropcountycalendar.com/events/chamber-breakfast/',
    }),
    events,
    new Date('2026-11-01T15:00:00Z'),
  );
  assert.equal(bySource, 'https://bastropcountycalendar.com/events/chamber-breakfast');

  const byTitle = redirectForLegacyEvent(
    'custom-id',
    local({
      id: 'custom-id',
      title: 'County Festival 2026',
      start: new Date('2026-12-05T18:00:00-06:00'),
      city: 'Bastrop',
    }),
    [bcc()],
    new Date('2026-11-01T15:00:00Z'),
  );
  assert.equal(byTitle, 'https://bastropcountycalendar.com/events/county-festival');
});

test('unmatched upcoming listings keep their date and past listings go to the calendar', () => {
  const upcoming = local({
    id: 'future-talk',
    title: 'Future Talk',
    start: new Date('2026-12-20T18:00:00-06:00'),
    end: new Date('2026-12-20T19:00:00-06:00'),
  });
  assert.equal(
    redirectForLegacyEvent('future-talk', upcoming, [], new Date('2026-11-22T15:00:00Z')),
    '/events?date=2026-12-20',
  );
  const past = local();
  assert.equal(
    redirectForLegacyEvent(past.id, past, [], new Date('2026-11-22T15:00:00Z')),
    '/events',
  );
  assert.equal(redirectForLegacyEvent('missing', undefined, [], new Date('2026-11-22T15:00:00Z')), null);
  assert.equal(
    redirectForLegacyEvent('county-festival', undefined, [bcc()], new Date('2026-11-22T15:00:00Z')),
    'https://bastropcountycalendar.com/events/county-festival',
  );
});

test('a bad feed does not replace the last good copy', async () => {
  let stored = JSON.stringify({
    fetchedAt: '2026-11-01T00:00:00Z',
    events: [bcc()],
    omitted: [],
  });
  let puts = 0;
  const kv = {
    async get() {
      return JSON.parse(stored);
    },
    async put(_key: string, value: string) {
      puts += 1;
      stored = value;
    },
  };

  const failed = await refreshBccEvents({
    kv: kv as never,
    fetchImpl: async () => new Response('nope', { status: 502 }),
  });
  assert.equal(failed.stored, false);
  assert.equal(failed.count, 1);
  assert.equal(puts, 0);

  const thrown = await refreshBccEvents({
    kv: kv as never,
    fetchImpl: async () => {
      throw new Error('network');
    },
  });
  assert.equal(thrown.stored, false);
  assert.equal(puts, 0);

  const garbage = await refreshBccEvents({
    kv: kv as never,
    fetchImpl: async () => Response.json({ events: [{ title: 'no url' }] }),
  });
  assert.equal(garbage.stored, false);
  assert.equal(puts, 0);
  assert.equal(parsePublicFeed({ error: 'Events unavailable' }), null);

  const saved = await refreshBccEvents({
    kv: kv as never,
    now: new Date('2026-11-22T12:00:00Z'),
    fetchImpl: async (input) => {
      assert.equal(String(input), BCC_EVENTS_FEED);
      return Response.json({ events: [bcc({ title: 'Updated Festival' })], omitted: [{ id: 'evt_old', reason: 'absurd-date' }] });
    },
  });
  assert.equal(saved.stored, true);
  assert.equal(saved.count, 1);
  assert.equal(puts, 1);
  const written = JSON.parse(stored);
  assert.equal(written.events[0].title, 'Updated Festival');
  assert.equal(written.fetchedAt, '2026-11-22T12:00:00.000Z');
  assert.equal(written.omitted[0].reason, 'absurd-date');
  assert.equal(BCC_EVENTS_KV_KEY, 'bcc:events');
});

test('a stored feed is returned without calling the public feed', async () => {
  let calls = 0;
  const events = await readCachedBccEvents({
    kv: {
      async get() {
        return { fetchedAt: '2026-11-22T12:00:00Z', events: [bcc()], omitted: [] };
      },
    } as never,
    allowFetch: true,
    fetchImpl: async () => {
      calls += 1;
      return Response.json({ events: [] });
    },
  });
  assert.equal(calls, 0);
  assert.equal(events?.[0].title, 'County Festival');
});

test('a request with an empty KV does not call the public feed', async () => {
  let calls = 0;
  const events = await runWithEventsSource('bcc', () =>
    readCachedBccEvents({
      kv: {
        async get() {
          return null;
        },
      } as never,
      allowFetch: true,
      fetchImpl: async () => {
        calls += 1;
        return Response.json({ events: [bcc()] });
      },
    }),
  );
  assert.equal(calls, 0);
  assert.equal(events, null);
});

test('a build with an empty KV can still fetch once', async () => {
  let calls = 0;
  const events = await readCachedBccEvents({
    kv: null,
    allowFetch: true,
    fetchImpl: async () => {
      calls += 1;
      return Response.json({
        events: [bcc({ id: 'evt_build', slug: 'build-festival', url: 'https://bastropcountycalendar.com/events/build-festival', title: 'Build Festival' })],
      });
    },
  });
  assert.equal(calls, 1);
  assert.equal(events?.[0].title, 'Build Festival');
});
