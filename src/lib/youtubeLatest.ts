import { channelPage, youtubeChannels, type YoutubeChannel } from '../data/youtubeChannels';
import { thumbnail, watchUrl } from '../data/videos';

export type LatestVideo = {
  channel: YoutubeChannel;
  videoId: string;
  title: string;
  when: string;
  ageMinutes: number;
  href: string;
  channelHref: string;
  thumb: string;
};

const MENU = new Set(['Add to queue', 'Save to playlist', 'Share', 'Watch later', 'Shorts']);
const TTL = 10 * 60 * 1000;
const cache = new Map<string, { at: number; video: LatestVideo | null }>();

const units: { pattern: RegExp; minutes: number; singular: string; plural: string }[] = [
  { pattern: /^(\d+)\s*(?:seconds?|s)\b/i, minutes: 1 / 60, singular: 'second', plural: 'seconds' },
  { pattern: /^(\d+)\s*(?:minutes?|min|m)\b/i, minutes: 1, singular: 'minute', plural: 'minutes' },
  { pattern: /^(\d+)\s*(?:hours?|h)\b/i, minutes: 60, singular: 'hour', plural: 'hours' },
  { pattern: /^(\d+)\s*(?:days?|d)\b/i, minutes: 1440, singular: 'day', plural: 'days' },
  { pattern: /^(\d+)\s*(?:weeks?|w)\b/i, minutes: 10080, singular: 'week', plural: 'weeks' },
  { pattern: /^(\d+)\s*(?:months?|mo)\b/i, minutes: 43200, singular: 'month', plural: 'months' },
  { pattern: /^(\d+)\s*(?:years?|y)\b/i, minutes: 525600, singular: 'year', plural: 'years' },
];

export function spokenWhen(when: string) {
  const text = when.trim().replace(/^streamed\s+/i, '');
  for (const unit of units) {
    const match = text.match(unit.pattern);
    if (!match) continue;
    const count = Number(match[1]);
    const word = count === 1 ? unit.singular : unit.plural;
    return `${count} ${word} ago`;
  }
  return text;
}

export function ageMinutes(when: string) {
  const text = when.trim().replace(/^streamed\s+/i, '');
  for (const unit of units) {
    const match = text.match(unit.pattern);
    if (!match) continue;
    return Number(match[1]) * unit.minutes;
  }
  return Number.MAX_SAFE_INTEGER;
}

function decodeTitle(value: string) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

const titleMarker = '"title":{"content":"';

function readVideos(html: string, limit: number) {
  const found: { videoId: string; title: string; when: string; ageMinutes: number }[] = [];
  const seen = new Set<string>();
  let from = 0;
  while (found.length < limit && from < html.length) {
    const start = html.indexOf(titleMarker, from);
    if (start === -1) break;
    const titleStart = start + titleMarker.length;
    const titleEnd = html.indexOf('"', titleStart);
    if (titleEnd === -1) break;
    const title = decodeTitle(html.slice(titleStart, titleEnd));
    from = titleEnd + 1;
    if (MENU.has(title)) continue;
    const window = html.slice(Math.max(0, start - 1500), start);
    const ids = [...window.matchAll(/"videoId":"([\w-]{11})"/g)];
    if (!ids.length) continue;
    const videoId = ids[ids.length - 1][1];
    if (seen.has(videoId)) continue;
    seen.add(videoId);
    const after = html.slice(start, start + 700);
    const when = after.match(/"content":"([^"]*ago)"/)?.[1] ?? '';
    found.push({ videoId, title, when: spokenWhen(when), ageMinutes: ageMinutes(when) });
  }
  return found;
}

/** Newest public video on a YouTube channel videos page. */
export function parseLatestVideo(html: string) {
  return readVideos(html, 1)[0] ?? null;
}

export function parseChannelVideos(html: string, limit = 6) {
  return readVideos(html, limit);
}

async function fetchLatest(channel: YoutubeChannel): Promise<LatestVideo | null> {
  const hit = cache.get(channel.id);
  if (hit && Date.now() - hit.at < TTL) return hit.video;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const page = channelPage(channel);
    const response = await fetch(`${page}/videos`, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        accept: 'text/html',
      },
    });
    if (!response.ok) throw new Error(String(response.status));
    const parsed = parseLatestVideo(await response.text());
    const video = parsed
      ? {
          channel,
          videoId: parsed.videoId,
          title: parsed.title,
          when: parsed.when,
          ageMinutes: parsed.ageMinutes,
          href: watchUrl(parsed.videoId),
          channelHref: page,
          thumb: thumbnail(parsed.videoId, 'hqdefault'),
        }
      : null;
    cache.set(channel.id, { at: Date.now(), video });
    return video;
  } catch (error) {
    console.error(`YouTube latest failed for ${channel.name}`, error);
    return hit?.video ?? null;
  } finally {
    clearTimeout(timer);
  }
}

const listCache = new Map<string, { at: number; videos: LatestVideo[] }>();

export async function channelVideos(channel: YoutubeChannel, limit = 6): Promise<LatestVideo[]> {
  const hit = listCache.get(channel.id);
  if (hit && Date.now() - hit.at < TTL) return hit.videos;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const page = channelPage(channel);
  try {
    const response = await fetch(`${page}/videos`, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        accept: 'text/html',
      },
    });
    if (!response.ok) throw new Error(String(response.status));
    const videos = parseChannelVideos(await response.text(), limit).map((video) => ({
      channel,
      videoId: video.videoId,
      title: video.title,
      when: video.when,
      ageMinutes: video.ageMinutes,
      href: watchUrl(video.videoId),
      channelHref: page,
      thumb: thumbnail(video.videoId, 'hqdefault'),
    }));
    listCache.set(channel.id, { at: Date.now(), videos });
    return videos;
  } catch (error) {
    console.error(`YouTube list failed for ${channel.name}`, error);
    return hit?.videos ?? [];
  } finally {
    clearTimeout(timer);
  }
}

export async function latestChannelVideos() {
  const videos = (await Promise.all(youtubeChannels.map((channel) => fetchLatest(channel)))).filter((video) => video !== null);
  return videos.sort((a, b) => a.ageMinutes - b.ageMinutes);
}
