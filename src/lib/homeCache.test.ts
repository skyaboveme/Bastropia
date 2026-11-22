import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EVENTS_FRESH_SECONDS,
  EVENTS_STALE_SECONDS,
  HOME_FRESH_SECONDS,
  HOME_STALE_SECONDS,
  cacheWindowState,
  cookieValue,
  eventCacheUrl,
  homeCacheState,
  homeCacheUrl,
  isEventCachePath,
  isHomePath,
} from './homeCache.ts';

test('homepage paths include the bare slash and a trailing slash', () => {
  assert.equal(isHomePath('/'), true);
  assert.equal(isHomePath(''), true);
  assert.equal(isHomePath('/index.html'), true);
  assert.equal(isHomePath('/news'), false);
});

test('the cache key keeps the town and drops tracking params', () => {
  assert.equal(homeCacheUrl('https://bastropia.com/?utm=1', ''), 'https://bastropia.com/');
  assert.equal(homeCacheUrl('https://bastropia.com/news', 'Elgin'), 'https://bastropia.com/?town=Elgin');
  assert.equal(
    homeCacheUrl('https://bastropia.com/', 'Cedar Creek'),
    'https://bastropia.com/?town=Cedar+Creek',
  );
});

test('a cookie town is read without mixing other cookies', () => {
  assert.equal(cookieValue('bastropia-city=Elgin; other=1', 'bastropia-city'), 'Elgin');
  assert.equal(cookieValue('bastropia-city=Cedar%20Creek', 'bastropia-city'), 'Cedar Creek');
  assert.equal(cookieValue(null, 'bastropia-city'), '');
});

test('fresh, stale, and expired follow the few-minute window', () => {
  const now = 1_000_000;
  assert.equal(homeCacheState(now - 30_000, now), 'fresh');
  assert.equal(homeCacheState(now - HOME_FRESH_SECONDS * 1000 + 1, now), 'fresh');
  assert.equal(homeCacheState(now - HOME_FRESH_SECONDS * 1000 - 1, now), 'stale');
  assert.equal(homeCacheState(now - (HOME_FRESH_SECONDS + HOME_STALE_SECONDS) * 1000 - 1, now), 'expired');
  assert.equal(homeCacheState(Number.NaN, now), 'expired');
});

test('event pages use a five-minute fresh window', () => {
  const now = 1_000_000;
  assert.equal(cacheWindowState(now - 30_000, now, EVENTS_FRESH_SECONDS, EVENTS_STALE_SECONDS), 'fresh');
  assert.equal(cacheWindowState(now - EVENTS_FRESH_SECONDS * 1000 + 1, now, EVENTS_FRESH_SECONDS, EVENTS_STALE_SECONDS), 'fresh');
  assert.equal(cacheWindowState(now - EVENTS_FRESH_SECONDS * 1000 - 1, now, EVENTS_FRESH_SECONDS, EVENTS_STALE_SECONDS), 'stale');
  assert.equal(
    cacheWindowState(now - (EVENTS_FRESH_SECONDS + EVENTS_STALE_SECONDS) * 1000 - 1, now, EVENTS_FRESH_SECONDS, EVENTS_STALE_SECONDS),
    'expired',
  );
});

test('event cache paths are the SSR calendars and not the feeds', () => {
  assert.equal(isEventCachePath('/events'), true);
  assert.equal(isEventCachePath('/events/'), true);
  assert.equal(isEventCachePath('/events/old-listing'), true);
  assert.equal(isEventCachePath('/this-weekend'), true);
  assert.equal(isEventCachePath('/calendar'), true);
  assert.equal(isEventCachePath('/now'), true);
  assert.equal(isEventCachePath('/news'), false);
  assert.equal(isEventCachePath('/events.xml'), false);
});

test('the event cache key keeps filters and the town, and drops tracking', () => {
  assert.equal(
    eventCacheUrl('https://bastropia.com/events?utm_source=fb&city=Elgin', ''),
    'https://bastropia.com/events?city=Elgin',
  );
  assert.equal(
    eventCacheUrl('https://bastropia.com/events/?when=today&category=music', 'Smithville'),
    'https://bastropia.com/events?category=music&when=today&town=Smithville',
  );
  assert.equal(
    eventCacheUrl('https://bastropia.com/this-weekend?fbclid=1&town=Nope', 'Bastrop'),
    'https://bastropia.com/this-weekend?town=Bastrop',
  );
});
