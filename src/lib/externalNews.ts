export type NewsSource = {
  id: string;
  name: string;
  home: string;
  feed: string;
  hosts: string[];
};

export const newsSources: NewsSource[] = [
  {
    id: 'community-impact',
    name: 'Community Impact',
    home: 'https://communityimpact.com/bastrop-cedar-creek/',
    feed: 'https://communityimpact.com/rss/bastrop-cedar-creek/',
    hosts: ['communityimpact.com', 'www.communityimpact.com'],
  },
  {
    id: 'kxan',
    name: 'KXAN',
    home: 'https://www.kxan.com/news/local/bastrop-county/',
    feed: 'https://www.kxan.com/news/local/bastrop-county/feed/',
    hosts: ['kxan.com', 'www.kxan.com'],
  },
];

export type Headline = {
  title: string;
  href: string;
  date: Date;
  label: string;
  summary: string;
  external: boolean;
};

export function latestHeadlines(
  desk: { id: string; data: { title: string; description: string; pubDate: Date; place: string } }[],
  external: ExternalStory[],
): Headline[] {
  const items: Headline[] = [
    ...desk.map((story) => ({
      title: story.data.title,
      href: `/news/${story.id}`,
      date: story.data.pubDate,
      label: story.data.place,
      summary: story.data.description,
      external: false,
    })),
    ...external.map((story) => ({
      title: story.title,
      href: story.link,
      date: story.published,
      label: story.source.name,
      summary: story.summary,
      external: true,
    })),
  ];
  const seen = new Set<string>();
  return items
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .filter((item) => (seen.has(item.href) ? false : (seen.add(item.href), true)));
}

export type ExternalStory = {
  title: string;
  link: string;
  published: Date;
  categories: string[];
  author: string;
  summary: string;
  source: Pick<NewsSource, 'id' | 'name' | 'home'>;
};

const TTL = 10 * 60 * 1000;
// Only stories that name Bastrop (the city or the county), Elgin, Smithville, Rosanky or Cedar Creek.
const aboutBastrop = /\b(bastrop|elgin|smithville|rosanky|cedar creek)\b/i;
// Outlets also tag stories with a town, so a "Bastrop" or "Elgin" tag counts. The broad "Bastrop County" tag alone does not.
const townTag = /^(bastrop|elgin|smithville|rosanky|cedar creek)$/i;

const cache = new Map<string, { at: number; items: ExternalStory[] }>();
const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

function tags(block: string, name: string) {
  return [...block.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'gi'))].map((match) => decode(match[1]).trim());
}

function plain(value: string, max: number) {
  const text = decode(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}

export function parseFeed(xml: string, source: NewsSource): ExternalStory[] {
  const stories: ExternalStory[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = plain(tags(block, 'title')[0] ?? '', 180);
    const published = new Date(tags(block, 'pubDate')[0] ?? '');
    let url: URL;
    try {
      url = new URL(tags(block, 'link')[0] ?? '');
    } catch {
      continue;
    }
    if (!title || Number.isNaN(published.getTime())) continue;
    if (url.protocol !== 'https:' || !source.hosts.includes(url.hostname)) continue;
    stories.push({
      title,
      link: url.toString(),
      published,
      categories: tags(block, 'category').map((value) => plain(value, 40)).filter(Boolean),
      author: plain(tags(block, 'dc:creator')[0] ?? '', 80),
      summary: plain(tags(block, 'description')[0] ?? '', 220),
      source: { id: source.id, name: source.name, home: source.home },
    });
  }
  return stories;
}

function isLocal(story: ExternalStory) {
  return aboutBastrop.test(`${story.title} ${story.summary}`) || story.categories.some((category) => townTag.test(category));
}

async function loadSource(source: NewsSource): Promise<ExternalStory[]> {
  const hit = cache.get(source.id);
  if (hit && Date.now() - hit.at < TTL) return hit.items;
  try {
    const response = await fetch(source.feed, {
      headers: { 'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)', accept: 'application/rss+xml, application/xml' },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`${source.name} feed returned ${response.status}`);
    const items = parseFeed(await response.text(), source).filter(isLocal);
    cache.set(source.id, { at: Date.now(), items });
    return items;
  } catch {
    // Keep serving the last good copy, and retry in a minute rather than on every request.
    cache.set(source.id, { at: Date.now() - TTL + 60_000, items: hit?.items ?? [] });
    return hit?.items ?? [];
  }
}

/**
 * Bastrop County stories from every configured outlet, newest first. Each outlet is cached ten minutes and fails on its own.
 * `perSource` caps how many stories one outlet can contribute, so a busy outlet cannot crowd out the others.
 */
export async function getExternalNews(limit = 8, perSource = Infinity, matching?: RegExp): Promise<ExternalStory[]> {
  const lists = await Promise.all(newsSources.map(loadSource));
  const seen = new Set<string>();
  return lists
    .map((items) => (matching ? items.filter((story) => matching.test(`${story.title} ${story.summary}`)) : items))
    .flatMap((items) => [...items].sort((a, b) => b.published.getTime() - a.published.getTime()).slice(0, perSource))
    .sort((a, b) => b.published.getTime() - a.published.getTime())
    .filter((story) => (seen.has(story.link) ? false : (seen.add(story.link), true)))
    .slice(0, limit);
}
