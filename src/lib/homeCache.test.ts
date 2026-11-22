import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOME_FRESH_SECONDS,
  HOME_STALE_SECONDS,
  cookieValue,
  homeCacheState,
  homeCacheUrl,
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
