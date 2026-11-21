import assert from 'node:assert/strict';
import test from 'node:test';
import { relatedStories, type StoryRef } from './relatedStories.ts';

const day = (iso: string) => new Date(iso);

function story(partial: Partial<StoryRef> & Pick<StoryRef, 'id' | 'place' | 'pubDate'>): StoryRef {
  return {
    title: partial.title ?? partial.id,
    description: partial.description ?? '',
    tags: partial.tags,
    ...partial,
  };
}

const desk: StoryRef[] = [
  story({ id: 'current', place: 'Bastrop', pubDate: day('2026-11-21T12:00:00Z'), tags: ['music', 'downtown'] }),
  story({ id: 'same-place-new', place: 'Bastrop', pubDate: day('2026-11-20T12:00:00Z'), tags: ['roads'] }),
  story({ id: 'same-place-old', place: 'bastrop', pubDate: day('2026-11-01T12:00:00Z') }),
  story({ id: 'tagged', place: 'Elgin', pubDate: day('2026-11-18T12:00:00Z'), tags: ['Music'] }),
  story({ id: 'both', place: 'Bastrop', pubDate: day('2026-11-19T12:00:00Z'), tags: ['downtown'] }),
  story({ id: 'recent-other', place: 'Smithville', pubDate: day('2026-11-21T18:00:00Z') }),
  story({ id: 'older-other', place: 'Paige', pubDate: day('2026-10-02T12:00:00Z') }),
];

test('the story being read is left out', () => {
  const picked = relatedStories('current', desk);
  assert.equal(picked.some((item) => item.id === 'current'), false);
});

test('same place and shared tags outrank a newer story from another town', () => {
  const ids = relatedStories('current', desk).map((item) => item.id);
  assert.deepEqual(ids.slice(0, 3), ['both', 'tagged', 'same-place-new']);
  assert.equal(ids.includes('recent-other'), false);
});

test('a place match is case-insensitive and a tag match fills the last slot by date', () => {
  const thin = desk.filter((item) => item.id !== 'both' && item.id !== 'tagged' && item.id !== 'same-place-new');
  const ids = relatedStories('current', thin).map((item) => item.id);
  assert.equal(ids[0], 'same-place-old');
  assert.equal(ids[1], 'recent-other');
  assert.equal(ids.length, 3);
});

test('with no place or tag in common, the newest other stories are used', () => {
  const solo = story({ id: 'only', place: 'McDade', pubDate: day('2026-11-21T12:00:00Z') });
  const ids = relatedStories('only', [solo, ...desk.filter((item) => item.id !== 'current')]).map((item) => item.id);
  assert.deepEqual(ids, ['recent-other', 'same-place-new', 'both', 'tagged']);
});

test('a missing current id still returns the newest stories', () => {
  const ids = relatedStories('missing', desk, 2).map((item) => item.id);
  assert.deepEqual(ids, ['recent-other', 'current']);
});

test('empty tags do not count as a match', () => {
  const stories = [
    story({ id: 'current', place: 'Elgin', pubDate: day('2026-11-21T12:00:00Z'), tags: [' ', ''] }),
    story({ id: 'blank', place: 'Bastrop', pubDate: day('2026-11-20T12:00:00Z'), tags: [''] }),
    story({ id: 'newer', place: 'Smithville', pubDate: day('2026-11-21T15:00:00Z') }),
  ];
  assert.deepEqual(
    relatedStories('current', stories).map((item) => item.id),
    ['newer', 'blank'],
  );
});
