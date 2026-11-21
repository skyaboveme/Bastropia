import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  chooseNewestFullEdition,
  classifyShortsUrl,
  decodeXml,
  isFresh,
  isShortEntry,
  parseChannelFeed,
  parseDailyVideo,
  selectFullEdition,
  videoEmbed,
} from './dailyVideoFeed';

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
 <entry>
  <yt:videoId>McVVPfFUkoU</yt:videoId>
  <title>Bastropia Daily in 30 seconds | Nov. 21, 2026 #Shorts</title>
  <link rel="alternate" href="https://www.youtube.com/shorts/McVVPfFUkoU"/>
  <published>2026-11-21T14:00:00+00:00</published>
 </entry>
 <entry>
  <yt:videoId>J9Q54JFRxZ0</yt:videoId>
  <title>Bastropia Daily | Saturday, Nov. 21, 2026</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=J9Q54JFRxZ0"/>
  <published>2026-11-21T13:44:53+00:00</published>
 </entry>
 <entry>
  <yt:videoId>olderwatch1</yt:videoId>
  <title>Bastropia Daily | Friday</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=olderwatch1"/>
  <published>2026-11-20T13:00:00+00:00</published>
 </entry>
</feed>`;

test('skips a newer Short and keeps the newest full edition', () => {
  const entries = parseChannelFeed(feed);
  assert.deepEqual(
    entries.map((entry) => entry.videoId),
    ['McVVPfFUkoU', 'J9Q54JFRxZ0', 'olderwatch1'],
  );
  assert.equal(isShortEntry(entries[0]), true);
  assert.equal(selectFullEdition(entries)?.videoId, 'J9Q54JFRxZ0');
});

test('skips a Short that is only marked with a #Shorts title', () => {
  const xml = `<feed><entry>
    <yt:videoId>abcdefghijk</yt:videoId>
    <title>County notes #Shorts</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abcdefghijk"/>
    <published>2026-11-21T15:00:00+00:00</published>
  </entry></feed>`;
  assert.equal(selectFullEdition(parseChannelFeed(xml)), null);
});

test('decodes xml text and keeps a hyphenated video id', () => {
  const xml = `<feed><entry>
    <yt:videoId>-G6kTDKX8UY</yt:videoId>
    <title><![CDATA[Fish &amp; Chips &#39;today&#39;]]></title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=-G6kTDKX8UY&amp;t=1"/>
    <published>2026-11-10T00:00:00+00:00</published>
  </entry></feed>`;
  const entry = parseChannelFeed(xml)[0];
  assert.equal(entry.videoId, '-G6kTDKX8UY');
  assert.equal(entry.title, "Fish & Chips 'today'");
  assert.equal(entry.link, 'https://www.youtube.com/watch?v=-G6kTDKX8UY&t=1');
  assert.equal(decodeXml('&lt;a&gt;'), '<a>');
});

test('orders an unsorted feed before choosing', async () => {
  const entries = parseChannelFeed(`<feed>
    <entry>
      <yt:videoId>bbbbbbbbbbb</yt:videoId>
      <title>Older full</title>
      <link rel="alternate" href="https://www.youtube.com/watch?v=bbbbbbbbbbb"/>
      <published>2026-11-01T00:00:00+00:00</published>
    </entry>
    <entry>
      <yt:videoId>aaaaaaaaaaa</yt:videoId>
      <title>Newer full</title>
      <link rel="alternate" href="https://www.youtube.com/watch?v=aaaaaaaaaaa"/>
      <published>2026-11-21T00:00:00+00:00</published>
    </entry>
  </feed>`);
  const chosen = await chooseNewestFullEdition(entries, async () => 'full');
  assert.equal(chosen?.videoId, 'aaaaaaaaaaa');
  assert.equal(videoEmbed('aaaaaaaaaaa'), 'https://www.youtube-nocookie.com/embed/aaaaaaaaaaa?rel=0');
});

test('a watch url that is actually a Short falls through to the next full edition', async () => {
  const entries = parseChannelFeed(`<feed>
    <entry>
      <yt:videoId>shortwatch1</yt:videoId>
      <title>Vertical upload</title>
      <link rel="alternate" href="https://www.youtube.com/watch?v=shortwatch1"/>
      <published>2026-11-21T16:00:00+00:00</published>
    </entry>
    <entry>
      <yt:videoId>J9Q54JFRxZ0</yt:videoId>
      <title>Full edition</title>
      <link rel="alternate" href="https://www.youtube.com/watch?v=J9Q54JFRxZ0"/>
      <published>2026-11-21T13:00:00+00:00</published>
    </entry>
  </feed>`);
  const chosen = await chooseNewestFullEdition(entries, async (videoId) => (videoId === 'shortwatch1' ? 'short' : 'full'));
  assert.equal(chosen?.videoId, 'J9Q54JFRxZ0');
});

test('an unknown shorts check still keeps the feed full edition', async () => {
  const entries = parseChannelFeed(feed);
  const chosen = await chooseNewestFullEdition(entries, async () => 'unknown');
  assert.equal(chosen?.videoId, 'J9Q54JFRxZ0');
});

test('classifyShortsUrl reads the redirect and does not follow it', async () => {
  const seen: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    seen.push(String(input));
    assert.equal(init?.method, 'HEAD');
    assert.equal(init?.redirect, 'manual');
    return new Response(null, {
      status: 303,
      headers: { location: 'https://www.youtube.com/watch?v=J9Q54JFRxZ0' },
    });
  };
  assert.equal(await classifyShortsUrl('J9Q54JFRxZ0', fetchImpl), 'full');
  assert.equal(seen[0], 'https://www.youtube.com/shorts/J9Q54JFRxZ0');

  const shortFetch: typeof fetch = async () => new Response('', { status: 200 });
  assert.equal(await classifyShortsUrl('McVVPfFUkoU', shortFetch), 'short');
});

test('parseDailyVideo keeps a real id and drops garbage', () => {
  assert.equal(parseDailyVideo(null), null);
  assert.equal(parseDailyVideo({ videoId: 'nope' }), null);
  assert.deepEqual(parseDailyVideo({ videoId: 'J9Q54JFRxZ0', title: 'Saturday', published: '2026-11-21', checkedAt: '2026-11-21T14:00:00.000Z' }), {
    videoId: 'J9Q54JFRxZ0',
    title: 'Saturday',
    published: '2026-11-21',
    checkedAt: '2026-11-21T14:00:00.000Z',
  });
});

test('isFresh is a 15 minute window', () => {
  const now = Date.parse('2026-11-21T14:00:00.000Z');
  const record = {
    videoId: 'J9Q54JFRxZ0',
    title: '',
    published: '',
    checkedAt: '2026-11-21T13:50:00.000Z',
  };
  assert.equal(isFresh(record, now), true);
  assert.equal(isFresh({ ...record, checkedAt: '2026-11-21T13:40:00.000Z' }, now), false);
  assert.equal(isFresh({ ...record, checkedAt: '' }, now), false);
});
