import assert from 'node:assert/strict';
import test from 'node:test';
import { cardImageUrl, listingImage, listingPlace, listingSnippet } from './eventPoster.ts';

const simple =
  'https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,h_1200,q_75,w_1200/v1/crm/bastroptx/sean.jpg';

test('simpleview urls shrink to a card fill', () => {
  assert.equal(
    cardImageUrl(simple),
    'https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,g_auto,h_360,q_70,w_640/v1/crm/bastroptx/sean.jpg',
  );
});

test('other image hosts stay as the feed sent them', () => {
  const local = 'https://bastropia.com/images/events/market.jpg';
  const cloud = 'https://res.cloudinary.com/demo/image/upload/c_limit,h_100,w_250/v1/pic.png';
  const site = '/images/events/market.jpg';
  assert.equal(cardImageUrl(local), local);
  assert.equal(cardImageUrl(cloud), cloud);
  assert.equal(cardImageUrl(site), site);
});

test('missing and generated placeholders use the brand image', () => {
  for (const value of [null, '', 'https://bastropcountycalendar.com/api/event-placeholder?title=A', 'https://bastropcountycalendar.com/og-default.png']) {
    const image = listingImage(value);
    assert.equal(image.fallback, true);
    assert.equal(image.src, '/brand/event-placeholder.svg');
  }
  assert.equal(listingImage(simple).fallback, false);
});

test('snippets skip a repeated title and break on a word', () => {
  assert.equal(listingSnippet('Market morning', 'Market morning'), '');
  assert.equal(listingSnippet('  Stalls   and music. ', 'Market'), 'Stalls and music.');
  const long = 'Food stalls stay open across three evenings along the river with live music after dark and a late seating.';
  const snippet = listingSnippet(long, 'Festival', 60);
  assert.ok(snippet.endsWith('…'));
  assert.ok(snippet.length < long.length);
  assert.equal(snippet.includes('  '), false);
});

test('place line names the venue and town once', () => {
  assert.equal(listingPlace("The Grace Miller", 'Bastrop'), "The Grace Miller · Bastrop");
  assert.equal(listingPlace('Bastrop', 'Bastrop'), 'Bastrop');
  assert.equal(listingPlace('Courthouse', 'Countywide'), 'Courthouse');
  assert.equal(listingPlace('', 'Elgin'), 'Elgin');
});
