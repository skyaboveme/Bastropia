/**
 * Homepage lead and wire-duplicate hiding, both driven by news frontmatter.
 * The Reporter sets `lead: true` on a story. It does not edit the homepage.
 */

type Dated = { id: string; data: { pubDate: Date; lead?: boolean } };

type CoverFields = {
  sourceUrl?: string;
  /** Wire slug or URL this desk story covers when it is not the sourceUrl. */
  covers?: string | string[];
};

export function pinnedLeadHref(stories: Dated[]): string | undefined {
  const pinned = stories.filter((story) => story.data.lead === true);
  if (!pinned.length) return undefined;
  pinned.sort((a, b) => {
    const byDate = b.data.pubDate.getTime() - a.data.pubDate.getTime();
    if (byDate) return byDate;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return `/news/${pinned[0].id}`;
}

function slugFromUrl(sourceUrl: string | undefined): string[] {
  if (!sourceUrl) return [];
  let pathname: string;
  try {
    pathname = new URL(sourceUrl).pathname;
  } catch {
    return [];
  }
  const segment = decodeURIComponent(pathname.replace(/\/+$/, '').split('/').pop() ?? '').trim();
  if (segment.length < 16 || !/[a-z]/i.test(segment)) return [];
  const tokens = [segment];
  const comma = segment.indexOf(',');
  if (comma !== -1) {
    const rest = segment.slice(comma + 1);
    if (rest.length >= 16 && /[a-z]/i.test(rest)) tokens.push(rest);
  }
  return tokens;
}

export function coverTokens(story: { data: CoverFields }): string[] {
  const tokens = slugFromUrl(story.data.sourceUrl);
  const extra = story.data.covers;
  const listed = typeof extra === 'string' ? [extra] : extra ?? [];
  for (const item of listed) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (/^https?:\/\//i.test(trimmed)) tokens.push(...slugFromUrl(trimmed));
    else if (trimmed.length >= 16) tokens.push(trimmed);
  }
  return [...new Set(tokens)];
}

export function coveredWire(href: string, stories: { data: CoverFields }[]): boolean {
  return stories.some((story) => coverTokens(story).some((token) => href.includes(token)));
}
