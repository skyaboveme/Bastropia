/**
 * Newest full edition on the Bastropia channel.
 * The uploads feed lists a 16:9 episode and a vertical Short. Shorts carry a
 * /shorts/ link (and, on this channel, a #Shorts title). A normal watch URL
 * is checked with a HEAD to /shorts/{id}: YouTube redirects a full edition
 * back to /watch, and answers 200 when the id is a Short.
 */

export const BASTROPIA_CHANNEL_ID = 'UCdxOffp6asSKV6aPNT1vkdA';
export const UPLOADS_PLAYLIST_ID = 'UUdxOffp6asSKV6aPNT1vkdA';
export const CHANNEL_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${BASTROPIA_CHANNEL_ID}`;
export const playlistEmbed = `https://www.youtube-nocookie.com/embed/videoseries?list=${UPLOADS_PLAYLIST_ID}`;

const VIDEO_ID = /^[\w-]{11}$/;
const SHORTS_HASHTAG = /(?:^|\s)#shorts\b/i;
const MAX_FEED_BYTES = 500_000;
const USER_AGENT = 'Mozilla/5.0 (compatible; Bastropia/1.0; +https://bastropia.com)';

export type FeedEntry = {
  videoId: string;
  title: string;
  published: string;
  link: string;
};

export type DailyVideoRecord = {
  videoId: string;
  title: string;
  published: string;
  checkedAt: string;
};

export type ShortsVerdict = 'short' | 'full' | 'unknown';

export function videoEmbed(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
}

export function isVideoId(value: string) {
  return VIDEO_ID.test(value);
}

function publishedTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function decodeXml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function tagText(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`));
  return decodeXml((match?.[1] ?? match?.[2] ?? '').trim());
}

function entryLink(block: string) {
  const tags = [...block.matchAll(/<link\b[^>]*>/g)].map((match) => match[0]);
  const tag = tags.find((item) => /\brel="alternate"/.test(item)) ?? tags[0];
  if (!tag) return '';
  const href = tag.match(/\bhref="([^"]*)"/)?.[1] ?? '';
  return decodeXml(href);
}

/** Newest first. Entries without an 11-character video id are dropped. */
export function parseChannelFeed(xml: string): FeedEntry[] {
  const entries: FeedEntry[] = [];
  for (const match of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)) {
    const block = match[1];
    const videoId = tagText(block, 'yt:videoId');
    if (!isVideoId(videoId)) continue;
    entries.push({
      videoId,
      title: tagText(block, 'title'),
      published: tagText(block, 'published'),
      link: entryLink(block),
    });
  }
  return entries.sort((a, b) => publishedTime(b.published) - publishedTime(a.published));
}

/** True when the feed itself says this upload is a Short. */
export function isShortEntry(entry: FeedEntry) {
  if (/\/shorts\//i.test(entry.link)) return true;
  if (SHORTS_HASHTAG.test(entry.title)) return true;
  return false;
}

/** First full edition in a newest-first list, using only the feed markup. */
export function selectFullEdition(entries: FeedEntry[]) {
  return entries.find((entry) => !isShortEntry(entry)) ?? null;
}

async function readBounded(response: Response, max = MAX_FEED_BYTES) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel();
        throw new Error('feed too large');
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function fetchChannelFeed(fetchImpl: typeof fetch = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(CHANNEL_FEED_URL, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/atom+xml, application/xml, text/xml',
      },
    });
    if (!response.ok) throw new Error(`feed status ${response.status}`);
    const advertised = Number(response.headers.get('content-length') || 0);
    if (advertised > MAX_FEED_BYTES) throw new Error('feed too large');
    return parseChannelFeed(await readBounded(response));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * HEAD https://www.youtube.com/shorts/{id} without following redirects.
 * A full edition is redirected to /watch. A Short stays on /shorts/ with 200.
 */
export async function classifyShortsUrl(videoId: string, fetchImpl: typeof fetch = fetch): Promise<ShortsVerdict> {
  if (!isVideoId(videoId)) return 'unknown';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetchImpl(`https://www.youtube.com/shorts/${videoId}`, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html',
      },
    });
    await response.body?.cancel().catch(() => undefined);
    const location = response.headers.get('location') ?? '';
    if (response.status >= 300 && response.status < 400) {
      if (/\/shorts\//i.test(location)) return 'short';
      if (/\/watch/i.test(location) || /[?&]v=/.test(location)) return 'full';
      return 'unknown';
    }
    if (response.status === 200) return 'short';
    return 'unknown';
  } catch {
    return 'unknown';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Newest entry that is not a Short. Feed markup is enough to skip a Short.
 * Watch-link entries are confirmed so a Short listed as /watch is skipped too.
 * An unknown answer keeps the entry: a failed check must not hide a full edition.
 * After four uncertain probes, the next feed-level full edition is kept.
 */
export async function chooseNewestFullEdition(
  entries: FeedEntry[],
  confirm: (videoId: string) => Promise<ShortsVerdict> = classifyShortsUrl,
) {
  const newest = [...entries].sort((a, b) => publishedTime(b.published) - publishedTime(a.published));
  let probes = 0;
  for (const entry of newest) {
    if (isShortEntry(entry)) continue;
    if (probes < 4) {
      probes += 1;
      const verdict = await confirm(entry.videoId);
      if (verdict === 'short') continue;
    }
    return entry;
  }
  return null;
}

export async function fetchNewestFullEdition(fetchImpl: typeof fetch = fetch) {
  const entries = await fetchChannelFeed(fetchImpl);
  return chooseNewestFullEdition(entries, (videoId) => classifyShortsUrl(videoId, fetchImpl));
}

export function parseDailyVideo(value: unknown): DailyVideoRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.videoId !== 'string' || !isVideoId(record.videoId)) return null;
  return {
    videoId: record.videoId,
    title: typeof record.title === 'string' ? record.title.slice(0, 180) : '',
    published: typeof record.published === 'string' ? record.published : '',
    checkedAt: typeof record.checkedAt === 'string' ? record.checkedAt : '',
  };
}

export function isFresh(record: DailyVideoRecord, now = Date.now(), maxAgeMs = 15 * 60 * 1000) {
  const checked = Date.parse(record.checkedAt);
  return Number.isFinite(checked) && now - checked >= 0 && now - checked < maxAgeMs;
}
