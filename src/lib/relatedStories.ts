/**
 * End-of-story picks. Same place and shared tags come first. The rest of the
 * slots are the newest other stories. The story being read is never included.
 */

export type StoryRef = {
  id: string;
  title: string;
  description?: string;
  place: string;
  pubDate: Date;
  tags?: string[];
};

function tagSet(tags: string[] | undefined) {
  const set = new Set<string>();
  for (const tag of tags ?? []) {
    const key = tag.trim().toLowerCase();
    if (key) set.add(key);
  }
  return set;
}

function byRecency(a: StoryRef, b: StoryRef) {
  const byDate = b.pubDate.getTime() - a.pubDate.getTime();
  if (byDate) return byDate;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function relatedStories<T extends StoryRef>(currentId: string, stories: T[], limit = 4): T[] {
  const pool = stories.filter((story) => story.id !== currentId);
  const current = stories.find((story) => story.id === currentId);
  if (!current) return [...pool].sort(byRecency).slice(0, limit);

  const place = current.place.trim().toLowerCase();
  const tags = tagSet(current.tags);
  const ranked = pool
    .map((story) => {
      const samePlace = place.length > 0 && story.place.trim().toLowerCase() === place;
      let shared = 0;
      if (tags.size) {
        for (const tag of tagSet(story.tags)) if (tags.has(tag)) shared += 1;
      }
      return { story, score: (samePlace ? 2 : 0) + shared * 3 };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || byRecency(a.story, b.story));

  const picked = ranked.slice(0, limit).map((item) => item.story);
  if (picked.length >= limit) return picked;
  const seen = new Set(picked.map((story) => story.id));
  const rest = pool.filter((story) => !seen.has(story.id)).sort(byRecency);
  return [...picked, ...rest].slice(0, limit);
}
