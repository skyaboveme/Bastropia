import { thumbnail, watchUrl } from '../data/videos';
import { parseChannelVideos } from './youtubeLatest';

export type CoverageVideo = {
  videoId: string;
  title: string;
  when: string;
  href: string;
  thumb: string;
  channel: string;
  channelHref: string;
  live: boolean;
};

const desks = [
  { name: 'KXAN', page: 'https://www.youtube.com/c/kxanaustinnews' },
  { name: 'KVUE', page: 'https://www.youtube.com/c/KVUETV' },
  { name: 'The Texas Tribune', page: 'https://www.youtube.com/@texastribune' },
  { name: 'FOX 7 Austin', page: 'https://www.youtube.com/@FOX7Austin' },
];

const aboutElection = /election|voting|ballot|midterm|senate|governor|talarico|paxton|abbott|hinojosa|eleccion|live news|24\/7/i;
const somewhereElse = /\bkyle\b|austin city council|weather|crash|cowboys|alzheimer/i;
const cacheMs = 60 * 1000;
let cache: { at: number; videos: CoverageVideo[] } | null = null;

async function pull(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        accept: 'text/html',
      },
    });
    if (!response.ok) throw new Error(String(response.status));
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function liveVideo(html: string, desk: (typeof desks)[number]): CoverageVideo | null {
  const raw = html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/ - YouTube$/, '') ?? '';
  if (!/^live\b/i.test(raw) && !/live stream/i.test(raw)) return null;
  const videoId = html.match(/"videoId":"([\w-]{11})"/)?.[1];
  if (!videoId) return null;
  return {
    videoId,
    title: raw,
    when: 'Live',
    href: watchUrl(videoId),
    thumb: thumbnail(videoId, 'hqdefault'),
    channel: desk.name,
    channelHref: desk.page,
    live: true,
  };
}

async function deskVideos(desk: (typeof desks)[number]): Promise<CoverageVideo[]> {
  try {
    const [liveHtml, videosHtml] = await Promise.all([
      pull(`${desk.page}/live`).catch(() => ''),
      pull(`${desk.page}/videos`).catch(() => ''),
    ]);
    const live = liveHtml ? liveVideo(liveHtml, desk) : null;
    const recent = parseChannelVideos(videosHtml, 8)
      .filter((video) => aboutElection.test(video.title) && !somewhereElse.test(video.title))
      .slice(0, 2)
      .map((video) => ({
        videoId: video.videoId,
        title: video.title,
        when: video.when,
        href: watchUrl(video.videoId),
        thumb: thumbnail(video.videoId, 'hqdefault'),
        channel: desk.name,
        channelHref: desk.page,
        live: false,
      }));
    return live ? [live, ...recent.filter((video) => video.videoId !== live.videoId)] : recent;
  } catch (error) {
    console.error(`Election coverage failed for ${desk.name}`, error);
    return [];
  }
}

export async function coverageVideos(): Promise<CoverageVideo[]> {
  if (cache && Date.now() - cache.at < cacheMs) return cache.videos;
  const found = (await Promise.all(desks.map(deskVideos))).flat();
  const seen = new Set<string>();
  const videos = found.filter((video) => {
    if (seen.has(video.videoId)) return false;
    seen.add(video.videoId);
    return true;
  });
  videos.sort((a, b) => Number(b.live) - Number(a.live));
  const picked = videos.slice(0, 6);
  cache = { at: Date.now(), videos: picked };
  return picked;
}
