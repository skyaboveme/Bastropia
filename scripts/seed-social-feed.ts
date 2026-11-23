/**
 * Collect the public social feed and write JSON for `wrangler kv key put`.
 * A blocked run does not replace a good KV copy. The 15-minute cron is the
 * steady refresh; this only fills the key when a deploy can see live posts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { collectSocialFeed, mergeSourcePosts, newestPerSource, parseSocialFeed } from '../src/lib/socialFeed.ts';

function readPrevious(path: string | undefined) {
  if (!path || !existsSync(path)) return null;
  try {
    const text = readFileSync(path, 'utf8').trim();
    if (!text) return null;
    return parseSocialFeed(JSON.parse(text));
  } catch {
    return null;
  }
}

const out = process.env.SOCIAL_FEED_OUT || 'tmp/social-feed.json';
const previous = readPrevious(process.env.SOCIAL_FEED_PREV);
const fresh = await collectSocialFeed();
const anyPage = fresh.results.some((result) => result.ok);
const anyVideo = fresh.videos.length > 0;
const skipped = fresh.results.filter((result) => !result.ok).map((result) => result.sourceId);
if (!anyPage && !anyVideo) {
  console.log(`social feed seed skipped, KV unchanged; skipped ${skipped.join(', ') || 'none'}`);
  process.exit(0);
}
const now = Date.now();
const record = {
  fetchedAt: new Date(now).toISOString(),
  posts: anyPage ? mergeSourcePosts(previous?.posts ?? [], fresh.results, now) : newestPerSource(previous?.posts ?? []),
  videos: anyVideo ? fresh.videos : previous?.videos ?? [],
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(record));
console.log(`social feed seed: ${record.posts.length} posts, ${record.videos.length} videos, skipped ${skipped.join(', ') || 'none'}`);
