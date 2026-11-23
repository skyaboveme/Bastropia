/**
 * Live social feed for /groups.
 *
 * The 15-minute cron fetches public Facebook pages and YouTube RSS, then
 * stores the result in KV under `social:feed`. The page only reads that
 * copy. A blocked page is skipped; its previous post stays until a later
 * run replaces it.
 */
import { parseChannelFeed } from './dailyVideoFeed.ts';
import { TZ } from './time.ts';
import {
  socialChannels,
  socialSources,
  type SocialChannel,
  type SocialLane,
  type SocialSource,
} from '../data/socialSources.ts';

export const SOCIAL_FEED_KEY = 'social:feed';
const MAX_POSTS = 30;
const MAX_POST_AGE_MS = 45 * 24 * 60 * 60 * 1000;
const MAX_VIDEO_AGE_MS = 120 * 24 * 60 * 60 * 1000;
const MAX_TEXT = 700;
const PAGE_GAP_MS = 800;
const BLOCK_STREAK = 3;

const browserHeaders = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

export type StoredPost = {
  id: string;
  sourceId: string;
  sourceName: string;
  lane: SocialLane;
  text: string;
  url: string;
  published: string;
  image?: string;
};

export type StoredVideo = {
  videoId: string;
  channelName: string;
  title: string;
  published: string;
  url: string;
  thumb: string;
};

export type SocialFeedRecord = {
  fetchedAt: string;
  posts: StoredPost[];
  videos: StoredVideo[];
};

export type SourceFetch = {
  sourceId: string;
  ok: boolean;
  posts: StoredPost[];
};

export type ParsedPublicPost = {
  id: string;
  text: string;
  url: string;
  published: string;
  image?: string;
};

function readJsonString(source: string, quoteAt: number) {
  if (source[quoteAt] !== '"') return '';
  let out = '';
  for (let i = quoteAt + 1; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\') {
      const next = source[i + 1] ?? '';
      if (next === 'u') {
        const hex = source.slice(i + 2, i + 6);
        const code = Number.parseInt(hex, 16);
        out += Number.isFinite(code) ? String.fromCharCode(code) : '';
        i += 5;
        continue;
      }
      const mapped: Record<string, string> = { n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\', '/': '/' };
      out += mapped[next] ?? next;
      i += 1;
      continue;
    }
    if (ch === '"') return out;
    out += ch;
  }
  return '';
}

function field(window: string, marker: string) {
  const at = window.indexOf(marker);
  if (at < 0) return '';
  return readJsonString(window, at + marker.length - 1);
}

function cleanText(value: string) {
  return value.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_TEXT);
}

function facebookUrl(value: string, fallback: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (url.protocol === 'https:' && (host === 'facebook.com' || host.endsWith('.facebook.com'))) return url.toString();
  } catch {
    // Fall through to the page posts URL.
  }
  return fallback;
}

function imageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return '';
    if (!url.hostname.toLowerCase().endsWith('fbcdn.net')) return '';
    if (url.toString().length > 2000) return '';
    return url.toString();
  } catch {
    return '';
  }
}

/** Newest public posts embedded in a logged-out Facebook page. */
export function parsePublicPosts(html: string, pageUrl: string): ParsedPublicPost[] {
  const posts: ParsedPublicPost[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/"post_id":"(\d+)"/g)) {
    const id = match[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const at = match.index ?? 0;
    const window = html.slice(at, Math.min(html.length, at + 120_000));
    const text = cleanText(field(window, '"message":{"text":"'));
    const image = imageUrl(field(window, '"preferred_thumbnail":{"image":{"uri":"'));
    if (!text && !image) continue;
    const time = window.match(/"creation_time":(\d+)/);
    const seconds = time ? Number(time[1]) : 0;
    if (!Number.isFinite(seconds) || seconds < 1_000_000_000) continue;
    const fallback = `${pageUrl.replace(/\/$/, '')}/posts/${id}`;
    const url = facebookUrl(field(window, '"permalink_url":"'), fallback);
    posts.push({
      id,
      text,
      url,
      published: new Date(seconds * 1000).toISOString(),
      ...(image ? { image } : {}),
    });
    if (posts.length >= 3) break;
  }
  return posts.sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
}

export function relativeTime(iso: string, now = Date.now()) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const delta = Math.max(0, now - then);
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hr ago' : `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric' }).format(new Date(then));
}

function isLane(value: string): value is SocialLane {
  return value === 'government' || value === 'safety' || value === 'news' || value === 'community';
}

function asPost(value: unknown): StoredPost | null {
  if (!value || typeof value !== 'object') return null;
  const post = value as Partial<StoredPost>;
  if (!post.id || !post.sourceId || !post.sourceName || !post.url || !post.published) return null;
  if (!post.lane || !isLane(post.lane)) return null;
  if (typeof post.text !== 'string') return null;
  const image = typeof post.image === 'string' && post.image.startsWith('https://') ? post.image : undefined;
  return {
    id: post.id,
    sourceId: post.sourceId,
    sourceName: post.sourceName,
    lane: post.lane,
    text: post.text,
    url: post.url,
    published: post.published,
    ...(image ? { image } : {}),
  };
}

function asVideo(value: unknown): StoredVideo | null {
  if (!value || typeof value !== 'object') return null;
  const video = value as Partial<StoredVideo>;
  if (!video.videoId || !video.channelName || !video.title || !video.published || !video.url || !video.thumb) return null;
  return {
    videoId: video.videoId,
    channelName: video.channelName,
    title: video.title,
    published: video.published,
    url: video.url,
    thumb: video.thumb,
  };
}

export function parseSocialFeed(value: unknown): SocialFeedRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<SocialFeedRecord>;
  if (typeof record.fetchedAt !== 'string' || !Number.isFinite(Date.parse(record.fetchedAt))) return null;
  const posts = Array.isArray(record.posts) ? record.posts.map(asPost).filter((post) => post !== null) : [];
  const videos = Array.isArray(record.videos) ? record.videos.map(asVideo).filter((video) => video !== null) : [];
  return { fetchedAt: record.fetchedAt, posts, videos };
}

/** Keep a blocked source's last post. A successful read replaces that source. */
export function mergeSourcePosts(previous: StoredPost[], results: SourceFetch[], now: number) {
  const bySource = new Map<string, StoredPost[]>();
  for (const post of previous) {
    const list = bySource.get(post.sourceId) ?? [];
    list.push(post);
    bySource.set(post.sourceId, list);
  }
  for (const result of results) {
    if (!result.ok) continue;
    bySource.set(result.sourceId, result.posts);
  }
  const posts = [...bySource.values()]
    .flat()
    .filter((post) => {
      const published = Date.parse(post.published);
      return Number.isFinite(published) && now - published <= MAX_POST_AGE_MS && now - published >= -60_000;
    });
  posts.sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  }).slice(0, MAX_POSTS);
}

function cookiePairs(response: Response, previous: string) {
  const lines = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const fresh = lines
    .map((line) => line.split(';')[0]?.trim() ?? '')
    .filter((pair) => /^(datr|sb|fr)=/.test(pair));
  const kept = previous.split(';').map((part) => part.trim()).filter((pair) => pair && !fresh.some((next) => next.split('=')[0] === pair.split('=')[0]));
  return [...kept, ...fresh].filter(Boolean).join('; ');
}

function isLoginWall(location: string) {
  return /facebook\.com\/login/i.test(location) || /\/login\.php/i.test(location);
}

async function fetchFacebook(url: string, cookie: string, fetchImpl: typeof fetch, depth = 0): Promise<{ html: string; cookie: string }> {
  const response = await fetchImpl(url, {
    headers: cookie ? { ...browserHeaders, cookie } : browserHeaders,
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
  });
  const nextCookie = cookiePairs(response, cookie);
  if (response.status >= 300 && response.status < 400 && depth < 1) {
    const location = response.headers.get('location') ?? '';
    if (!location || isLoginWall(location)) return { html: '', cookie: nextCookie };
    try {
      const next = new URL(location, url);
      const host = next.hostname.replace(/^www\./i, '').toLowerCase();
      if (next.protocol === 'https:' && (host === 'facebook.com' || host.endsWith('.facebook.com'))) {
        return fetchFacebook(next.toString(), nextCookie, fetchImpl, depth + 1);
      }
    } catch {
      return { html: '', cookie: nextCookie };
    }
    return { html: '', cookie: nextCookie };
  }
  if (response.status !== 200) return { html: '', cookie: nextCookie };
  return { html: await response.text(), cookie: nextCookie };
}

async function fetchSource(source: SocialSource, cookie: string, fetchImpl: typeof fetch): Promise<{ result: SourceFetch; cookie: string }> {
  try {
    const page = await fetchFacebook(source.href, cookie, fetchImpl);
    if (!page.html) return { result: { sourceId: source.id, ok: false, posts: [] }, cookie: page.cookie };
    const posts = parsePublicPosts(page.html, source.href).map((post) => ({
      id: `${source.id}:${post.id}`,
      sourceId: source.id,
      sourceName: source.name,
      lane: source.lane,
      text: post.text,
      url: post.url,
      published: post.published,
      ...(post.image ? { image: post.image } : {}),
    }));
    return { result: { sourceId: source.id, ok: true, posts }, cookie: page.cookie };
  } catch (error) {
    console.error(`social source skipped: ${source.id}`, error);
    return { result: { sourceId: source.id, ok: false, posts: [] }, cookie };
  }
}

async function fetchChannel(channel: SocialChannel, fetchImpl: typeof fetch, now: number): Promise<StoredVideo | null> {
  try {
    const response = await fetchImpl(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; Bastropia/1.0; +https://bastropia.com)',
        accept: 'application/atom+xml, application/xml, text/xml',
      },
    });
    if (!response.ok) return null;
    const entry = parseChannelFeed(await response.text())[0];
    if (!entry) return null;
    const published = Date.parse(entry.published);
    if (!Number.isFinite(published) || now - published > MAX_VIDEO_AGE_MS) return null;
    return {
      videoId: entry.videoId,
      channelName: channel.name,
      title: entry.title.slice(0, 180),
      published: new Date(published).toISOString(),
      url: entry.link || `https://www.youtube.com/watch?v=${entry.videoId}`,
      thumb: `https://i.ytimg.com/vi/${entry.videoId}/hqdefault.jpg`,
    };
  } catch (error) {
    console.error(`social video skipped: ${channel.id}`, error);
    return null;
  }
}

function rotateSources(sources: SocialSource[], now: number) {
  if (sources.length < 2) return sources;
  const offset = Math.floor(now / (15 * 60 * 1000)) % sources.length;
  return [...sources.slice(offset), ...sources.slice(0, offset)];
}

export async function collectSocialFeed(options?: {
  fetchImpl?: typeof fetch;
  now?: Date;
  sources?: SocialSource[];
  channels?: SocialChannel[];
  gapMs?: number;
  rotate?: boolean;
}): Promise<{ posts: StoredPost[]; videos: StoredVideo[]; results: SourceFetch[] }> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const now = options?.now ?? new Date();
  const sources = options?.rotate === false ? (options?.sources ?? socialSources) : rotateSources(options?.sources ?? socialSources, now.getTime());
  const channels = options?.channels ?? socialChannels;
  const gapMs = options?.gapMs ?? PAGE_GAP_MS;
  let cookie = '';
  let misses = 0;
  const results: SourceFetch[] = [];
  for (const source of sources) {
    if (misses >= BLOCK_STREAK) {
      results.push({ sourceId: source.id, ok: false, posts: [] });
      continue;
    }
    if (results.length && gapMs > 0) await new Promise((resolve) => setTimeout(resolve, gapMs));
    const fetched = await fetchSource(source, cookie, fetchImpl);
    cookie = fetched.cookie || cookie;
    results.push(fetched.result);
    misses = fetched.result.ok ? 0 : misses + 1;
  }
  const videos = (await Promise.all(channels.map((channel) => fetchChannel(channel, fetchImpl, now.getTime()))))
    .filter((video) => video !== null)
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  const posts = mergeSourcePosts([], results, now.getTime());
  return { posts, videos, results };
}

type SessionKvLike = {
  get(key: string, type: 'json'): Promise<unknown>;
  put(key: string, value: string): Promise<unknown>;
};

async function kvStore(): Promise<SessionKvLike | undefined> {
  try {
    const { sessionKv } = await import('./sessionKv');
    return sessionKv();
  } catch (error) {
    console.error('social feed kv unavailable', error);
    return undefined;
  }
}

export async function readSocialFeed(): Promise<SocialFeedRecord | null> {
  try {
    const kv = await kvStore();
    if (!kv) return null;
    return parseSocialFeed(await kv.get(SOCIAL_FEED_KEY, 'json'));
  } catch (error) {
    console.error('social feed read failed', error);
    return null;
  }
}

/**
 * Cron entry. A failed source keeps its previous post. Nothing is written
 * when every Facebook page and every YouTube feed fails, so the last good
 * copy stays in place.
 */
export async function refreshSocialFeed(): Promise<SocialFeedRecord | null> {
  const kv = await kvStore();
  let previous: SocialFeedRecord | null = null;
  if (kv) {
    try {
      previous = parseSocialFeed(await kv.get(SOCIAL_FEED_KEY, 'json'));
    } catch (error) {
      console.error('social feed previous read failed', error);
    }
  }
  try {
    const fresh = await collectSocialFeed();
    const anyPage = fresh.results.some((result) => result.ok);
    const posts = anyPage ? mergeSourcePosts(previous?.posts ?? [], fresh.results, Date.now()) : previous?.posts ?? [];
    const videos = fresh.videos.length ? fresh.videos : previous?.videos ?? [];
    if (!anyPage && !fresh.videos.length) {
      console.error('social feed refresh kept the previous copy');
      return previous;
    }
    const record: SocialFeedRecord = {
      fetchedAt: new Date().toISOString(),
      posts,
      videos,
    };
    const skipped = fresh.results.filter((result) => !result.ok).map((result) => result.sourceId);
    console.log(`social feed stored ${record.posts.length} posts, ${record.videos.length} videos; skipped ${skipped.join(', ') || 'none'}`);
    if (kv) {
      try {
        await kv.put(SOCIAL_FEED_KEY, JSON.stringify(record));
      } catch (error) {
        console.error('social feed store failed', error);
      }
    }
    return record;
  } catch (error) {
    console.error('social feed refresh failed', error);
    return previous;
  }
}
