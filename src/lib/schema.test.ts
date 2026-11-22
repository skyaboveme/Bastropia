import assert from 'node:assert/strict';
import test from 'node:test';
import type { CollectionEntry } from 'astro:content';
import { articleAuthor, dailyVideoNode, eventNode, eventOffers, newsNode } from './schema.ts';

const start = new Date('2026-11-21T18:00:00-06:00');

function event(data: Partial<CollectionEntry<'events'>['data']> = {}): CollectionEntry<'events'> {
  return {
    id: 'sample-night',
    data: {
      title: 'Sample night',
      summary: 'A listing used by the schema test.',
      start,
      schedule: 'timed',
      city: 'Bastrop',
      venue: 'Main Street',
      category: 'music',
      cost: 'See the listing',
      tier: 'community',
      ...data,
    },
  } as CollectionEntry<'events'>;
}

test('a vague cost does not invent an offer', () => {
  assert.equal(eventOffers('See the listing', 'https://bastropia.com/events/sample-night'), undefined);
  assert.equal(eventOffers('Included with museum admission', 'https://bastropia.com/events/sample-night'), undefined);
  assert.equal(eventOffers('Public meeting', 'https://bastropia.com/events/sample-night'), undefined);
});

test('free and priced costs become offers', () => {
  const free = eventOffers('Free for spectators', 'https://example.test/e');
  assert.equal(free && 'price' in free ? free.price : '', '0');
  const priced = eventOffers('$15 adult, $10 child or student', 'https://example.test/e');
  assert.equal(priced?.['@type'], 'AggregateOffer');
  assert.equal(priced && 'lowPrice' in priced ? priced.lowPrice : '', '10');
  assert.equal(priced && 'highPrice' in priced ? priced.highPrice : '', '15');
});

test('event schema keeps known fields and skips unknown ones', () => {
  const plain = eventNode(event());
  assert.equal(plain.url, 'https://bastropia.com/events/sample-night');
  assert.equal(plain.eventStatus, 'https://schema.org/EventScheduled');
  assert.equal(plain.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
  assert.equal('endDate' in plain, false);
  assert.equal('offers' in plain, false);
  assert.equal('performer' in plain, false);

  const rich = eventNode(
    event({
      end: new Date('2026-11-21T20:00:00-06:00'),
      cost: 'Free',
      performer: 'The House Band',
      streamUrl: 'https://example.test/live',
      eventStatus: 'postponed',
    }),
  );
  assert.equal(typeof rich.endDate, 'string');
  assert.equal((rich.offers as { price: string }).price, '0');
  assert.deepEqual(rich.performer, { '@type': 'Person', name: 'The House Band' });
  assert.equal(rich.eventAttendanceMode, 'https://schema.org/MixedEventAttendanceMode');
  assert.equal(rich.eventStatus, 'https://schema.org/EventPostponed');
});

test('news without an author stays the Bastropia desk', () => {
  assert.deepEqual(articleAuthor(undefined), {
    '@type': 'Organization',
    name: 'Bastropia desk',
    url: 'https://bastropia.com/staff',
  });
  assert.equal(articleAuthor('not-a-person')['@type'], 'Organization');
});

test('an updated date and key facts land on the article', () => {
  const story = {
    id: 'bridge',
    data: {
      title: 'Bridge opens',
      description: 'The bridge opens after repairs.',
      pubDate: new Date('2026-11-01T08:00:00-06:00'),
      updated: new Date('2026-11-20T09:00:00-06:00'),
      place: 'Bastrop',
      keyFacts: ['Reopens Dec. 3', 'SH 150 at the river'],
      image: '/images/news/bridge.jpg',
    },
  } as CollectionEntry<'news'>;
  const node = newsNode(story, { width: 1600, height: 900 });
  assert.notEqual(node.dateModified, node.datePublished);
  assert.equal(node.abstract, 'Reopens Dec. 3 SH 150 at the river');
  assert.equal(node.author['@type'], 'Organization');
  const image = (node.image as { width: number; height: number }[])[0];
  assert.equal(image.width, 1600);
  assert.equal(image.height, 900);
});

test('a daily video uses the YouTube fields already on the record', () => {
  const node = dailyVideoNode({
    videoId: 'abcdefghijk',
    title: 'Bastropia Daily | Saturday',
    published: '2026-11-21T13:44:53+00:00',
  });
  assert.equal(node?.name, 'Bastropia Daily | Saturday');
  assert.equal(node?.uploadDate, '2026-11-21T13:44:53+00:00');
  assert.equal(node?.embedUrl, 'https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0');
  assert.equal(node?.contentUrl, 'https://www.youtube.com/watch?v=abcdefghijk');
  assert.ok(String(node?.thumbnailUrl).includes('abcdefghijk'));
  assert.equal(dailyVideoNode({ videoId: 'short', title: 'Nope' }), undefined);
});
