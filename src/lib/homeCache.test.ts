import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOME_FRESH_SECONDS,
  HOME_STALE_SECONDS,
  PAGE_FRESH_SECONDS,
  PAGE_STALE_SECONDS,
  cacheKind,
  cookieValue,
  eventCacheUrl,
  homeCacheState,
  homeCacheUrl,
  isHomePath,
  pageCacheState,
  variesByTown,
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

test('event pages share the edge cache and keep the filters that change HTML', () => {
  assert.equal(cacheKind('/'), 'home');
  assert.equal(cacheKind('/events'), 'event');
  assert.equal(cacheKind('/events/'), 'event');
  assert.equal(cacheKind('/this-weekend'), 'event');
  assert.equal(cacheKind('/calendar'), 'event');
  assert.equal(cacheKind('/now'), 'event');
  assert.equal(cacheKind('/bastrop'), 'event');
  assert.equal(cacheKind('/events/some-old-id'), null);
  assert.equal(cacheKind('/news'), null);
  assert.equal(variesByTown('/now'), true);
  assert.equal(variesByTown('/events'), false);
  assert.equal(PAGE_FRESH_SECONDS, 300);
  assert.ok(PAGE_STALE_SECONDS >= 15 * 60);
  assert.ok(HOME_FRESH_SECONDS + HOME_STALE_SECONDS > 15 * 60);

  assert.equal(
    eventCacheUrl('https://bastropia.com/events?utm_source=x&when=today&page=2', ''),
    'https://bastropia.com/events?when=today&page=2',
  );
  assert.equal(
    eventCacheUrl('https://bastropia.com/now?utm=1', 'Elgin'),
    'https://bastropia.com/now?town=Elgin',
  );
  assert.equal(eventCacheUrl('https://bastropia.com/this-weekend?fbclid=1', 'Elgin'), 'https://bastropia.com/this-weekend');
});

test('event pages stay fresh for five minutes and then stale', () => {
  const now = 1_000_000;
  assert.equal(pageCacheState(now - 30_000, now), 'fresh');
  assert.equal(pageCacheState(now - PAGE_FRESH_SECONDS * 1000 - 1, now), 'stale');
  assert.equal(pageCacheState(now - (PAGE_FRESH_SECONDS + PAGE_STALE_SECONDS) * 1000 - 1, now), 'expired');
});

test('fresh, stale, and expired follow the few-minute window', () => {
  const now = 1_000_000;
  assert.equal(homeCacheState(now - 30_000, now), 'fresh');
  assert.equal(homeCacheState(now - HOME_FRESH_SECONDS * 1000 + 1, now), 'fresh');
  assert.equal(homeCacheState(now - HOME_FRESH_SECONDS * 1000 - 1, now), 'stale');
  assert.equal(homeCacheState(now - (HOME_FRESH_SECONDS + HOME_STALE_SECONDS) * 1000 - 1, now), 'expired');
  assert.equal(homeCacheState(Number.NaN, now), 'expired');
});
