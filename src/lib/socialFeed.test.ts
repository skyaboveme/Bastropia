import assert from 'node:assert/strict';
import { test } from 'node:test';
import { directoryShelves } from '../data/facebookDirectory.ts';
import { socialSources } from '../data/socialSources.ts';
import { describeListing, directoryCards } from './directoryListing.ts';
import { collectSocialFeed, mergeSourcePosts, parsePublicPosts, parseSocialFeed, relativeTime, type StoredPost } from './socialFeed.ts';

const html = `
"post_id":"122112926109525900","creation_time":1795394399,"attachments":[]
"message":{"text":"Bastropia Daily is your local news video.\\nToday's weather.","permalink":null}
"permalink_url":"https:\\/\\/www.facebook.com\\/reel\\/1697322105352870\\/"
"preferred_thumbnail":{"image":{"uri":"https:\\/\\/scontent.xx.fbcdn.net\\/v\\/clip.jpg?stp=dst"}}
"post_id":"122112926109525900"
"image":{"uri":"https://evil.example/track.png"}
`;

test('parsePublicPosts reads the public post, permalink, and thumbnail', () => {
  const posts = parsePublicPosts(html, 'https://www.facebook.com/bastropia');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].id, '122112926109525900');
  assert.match(posts[0].text, /Bastropia Daily/);
  assert.match(posts[0].text, /Today's weather/);
  assert.equal(posts[0].url, 'https://www.facebook.com/reel/1697322105352870/');
  assert.equal(posts[0].image, 'https://scontent.xx.fbcdn.net/v/clip.jpg?stp=dst');
  assert.equal(posts[0].published, '2026-11-23T00:39:59.000Z');
});

test('parsePublicPosts skips a page with no story', () => {
  assert.deepEqual(parsePublicPosts('<html>log in</html>', 'https://www.facebook.com/bastropia'), []);
});

test('relativeTime uses minute and hour phrases', () => {
  const now = Date.parse('2026-11-23T18:00:00.000Z');
  assert.equal(relativeTime(new Date(now - 23 * 60_000).toISOString(), now), '23 min ago');
  assert.equal(relativeTime(new Date(now - 60 * 60_000).toISOString(), now), '1 hr ago');
  assert.equal(relativeTime(new Date(now - 2 * 24 * 60 * 60_000).toISOString(), now), '2 days ago');
});

test('mergeSourcePosts keeps a blocked source and replaces a successful one', () => {
  const now = Date.parse('2026-11-23T18:00:00.000Z');
  const previous: StoredPost[] = [
    {
      id: 'city:1',
      sourceId: 'city',
      sourceName: 'City of Bastrop',
      lane: 'government',
      text: 'Old outage',
      url: 'https://www.facebook.com/bastroptx/posts/1',
      published: '2026-11-22T18:00:00.000Z',
    },
    {
      id: 'oem:1',
      sourceId: 'oem',
      sourceName: 'OEM',
      lane: 'safety',
      text: 'Fog',
      url: 'https://www.facebook.com/BastropCountyOEM/posts/1',
      published: '2026-11-21T18:00:00.000Z',
    },
  ];
  const merged = mergeSourcePosts(previous, [
    {
      sourceId: 'city',
      ok: true,
      posts: [{ ...previous[0], id: 'city:2', text: 'Power restored', published: '2026-11-23T17:00:00.000Z' }],
    },
    { sourceId: 'oem', ok: false, posts: [] },
  ], now);
  assert.deepEqual(merged.map((post) => post.id), ['city:2', 'oem:1']);
});

test('parseSocialFeed drops a broken record', () => {
  assert.equal(parseSocialFeed(null), null);
  const parsed = parseSocialFeed({
    fetchedAt: '2026-11-23T18:00:00.000Z',
    posts: [{ id: 'a', sourceId: 'a', sourceName: 'A', lane: 'news', text: 'Hi', url: 'https://www.facebook.com/a', published: '2026-11-23T17:00:00.000Z' }],
    videos: [],
  });
  assert.equal(parsed?.posts.length, 1);
});

test('collect stops after a block streak and does not call the rest', async () => {
  let facebookCalls = 0;
  const fetchImpl: typeof fetch = async (input) => {
    const href = String(input);
    if (href.includes('youtube.com')) return new Response('<feed></feed>', { status: 200 });
    facebookCalls += 1;
    if (facebookCalls > 2) {
      return new Response('', { status: 302, headers: { location: 'https://www.facebook.com/login/?next=1' } });
    }
    return new Response(html, { status: 200 });
  };
  const sources = socialSources.slice(0, 6);
  const fresh = await collectSocialFeed({
    fetchImpl,
    sources,
    channels: [],
    gapMs: 0,
    rotate: false,
    now: new Date('2026-11-23T18:00:00.000Z'),
  });
  assert.equal(fresh.results.filter((result) => result.ok).length, 2);
  assert.equal(facebookCalls, 5);
  assert.equal(fresh.posts.length, 2);
  assert.equal(fresh.posts.filter((post) => post.sourceId === sources[0].id).length, 1);
});

test('directory cards keep every shelf item', () => {
  const shelves = directoryCards(directoryShelves);
  const input = directoryShelves.reduce((count, shelf) => count + shelf.items.length, 0);
  const output = shelves.reduce((count, shelf) => count + shelf.items.length, 0);
  assert.equal(output, input);
  assert.ok(input > 100);
  const group = describeListing('Public · about 36,000 members · Bastrop County', 'group');
  assert.equal(group.type, 'Public group');
  assert.equal(group.members, 'about 36,000 members');
  assert.equal(group.note, 'Bastrop County');
  const page = describeListing('Government Organization · Bastrop County', 'page', 'For an emergency, call 911.');
  assert.equal(page.type, 'Page');
  assert.equal(page.members, '');
  assert.match(page.note, /911/);
  const closed = describeListing('Private · about 25,000 members · Bastrop · about 80 posts a day', 'group');
  assert.equal(closed.type, 'Private group');
  assert.match(closed.note, /80 posts/);
});
