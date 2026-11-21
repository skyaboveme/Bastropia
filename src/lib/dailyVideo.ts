import { sessionKv, type SessionKv } from './sessionKv';
import {
  fetchNewestFullEdition,
  isFresh,
  parseDailyVideo,
  playlistEmbed,
  videoEmbed,
  type DailyVideoRecord,
} from './dailyVideoFeed';

export { playlistEmbed, videoEmbed };
export type { DailyVideoRecord };

const STORAGE_KEY = 'daily:video';

function kvStore(): SessionKv | undefined {
  try {
    return sessionKv();
  } catch (error) {
    console.error('daily video kv unavailable', error);
    return undefined;
  }
}

async function readStored(kv: SessionKv): Promise<DailyVideoRecord | null> {
  try {
    return parseDailyVideo(await kv.get(STORAGE_KEY, 'json'));
  } catch (error) {
    console.error('daily video read failed', error);
    return null;
  }
}

/**
 * Read the channel feed, keep the newest full edition, and store it in KV.
 * A failed read leaves the previous id in place. Nothing is written when the
 * feed has no full edition, so the last good id survives.
 */
export async function refreshDailyVideo(): Promise<DailyVideoRecord | null> {
  const kv = kvStore();
  const previous = kv ? await readStored(kv) : null;
  try {
    const chosen = await fetchNewestFullEdition();
    if (!chosen) return previous;
    const record: DailyVideoRecord = {
      videoId: chosen.videoId,
      title: chosen.title.slice(0, 180),
      published: chosen.published,
      checkedAt: new Date().toISOString(),
    };
    if (kv) {
      try {
        await kv.put(STORAGE_KEY, JSON.stringify(record));
      } catch (error) {
        console.error('daily video store failed', error);
      }
    }
    return record;
  } catch (error) {
    console.error('daily video refresh failed', error);
    return previous;
  }
}

/** KV hit, including a stale one. Does not call YouTube. */
export async function readDailyVideo(): Promise<DailyVideoRecord | null> {
  const kv = kvStore();
  if (!kv) return null;
  return readStored(kv);
}

/**
 * Cached edition for the page. When KV is empty, refresh once so the first
 * view is a full edition rather than the uploads playlist.
 */
export async function currentDailyVideo(): Promise<DailyVideoRecord | null> {
  try {
    const cached = await readDailyVideo();
    if (cached) return cached;
    return await refreshDailyVideo();
  } catch (error) {
    console.error('daily video lookup failed', error);
    return null;
  }
}

/** Fresh KV value, or a refresh when the saved edition is missing or older than 15 minutes. */
export async function resolveDailyVideo(): Promise<DailyVideoRecord | null> {
  try {
    const cached = await readDailyVideo();
    if (cached && isFresh(cached)) return cached;
    const fresh = await refreshDailyVideo();
    return fresh ?? cached;
  } catch (error) {
    console.error('daily video resolve failed', error);
    return null;
  }
}
