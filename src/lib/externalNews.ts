export type NewsSource = {
  id: string;
  name: string;
  home: string;
  feed: string;
  hosts: string[];
  /** Austin newsrooms. Kept for the county RSS, and only when a story names the county or a town in it. */
  wire?: boolean;
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
  {
    id: 'elgin-courier',
    name: 'Elgin Courier',
    home: 'https://www.elgincourier.com/',
    feed: 'https://www.elgincourier.com/rss/articles',
    hosts: ['elgincourier.com', 'www.elgincourier.com'],
  },
  {
    id: 'fox7',
    name: 'FOX 7',
    home: 'https://www.fox7austin.com/local-news',
    feed: 'https://www.fox7austin.com/rss/category/local-news',
    hosts: ['fox7austin.com', 'www.fox7austin.com'],
    wire: true,
  },
];

export type Headline = {
  title: string;
  href: string;
  date: Date;
  label: string;
  place: string;
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
      place: story.data.place,
      summary: story.data.description,
      external: false,
    })),
    ...external.map((story) => ({
      title: story.title,
      href: story.link,
      date: story.published,
      label: storyLabel(story),
      place: story.place,
      summary: closeSummary(story.summary),
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
  place: string;
  sponsored: boolean;
  source: Pick<NewsSource, 'id' | 'name' | 'home'>;
};

// More specific places first. "Bastrop" is last so "Bastrop County" does not hide Smithville or Rosanky.
const places: [string, RegExp][] = [
  ['Tahitian Village', /\btahitian village\b/i],
  ['The Colony', /\bthe colony\b/i],
  ['Rosanky', /\brosanky\b/i],
  ['Cedar Creek', /\bcedar creek\b/i],
  ['Smithville', /\bsmithville\b/i],
  ['Elgin', /\belgin\b/i],
  ['Paige', /\bpaige\b/i],
  ['McDade', /\bmcdade\b/i],
  ['Red Rock', /\bred rock\b/i],
];

const gapPlaces = new Set(['Smithville', 'Rosanky', 'Tahitian Village', 'The Colony']);
const sponsorWords = /\b(sponsored|paid post|paid content|presented by|advertorial)\b/i;

export function storyLabel(story: ExternalStory) {
  const parts = [story.source.name];
  if (story.place && story.place !== 'Countywide') parts.push(story.place);
  if (story.sponsored) parts.push('Sponsored');
  return parts.join(' · ');
}

function cityOfBastrop(text: string) {
  return /\bbastrop\b/i.test(text.replace(/\bbastrop county\b/gi, ''));
}

function placeOf(title: string, summary: string) {
  const named = (text: string) => places.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  const inTitle = named(title);
  if (inTitle.length) return inTitle[0];
  if (cityOfBastrop(title)) return 'Bastrop';
  const inSummary = named(summary);
  if (inSummary.length) return inSummary[0];
  if (cityOfBastrop(summary)) return 'Bastrop';
  return 'Countywide';
}

function isSponsored(story: { title: string; summary: string; link: string; source: { id: string } }, place: string) {
  if (sponsorWords.test(`${story.title} ${story.summary} ${story.link}`)) return true;
  // Community Impact's Colony headlines are usually posts from the developer, not the newsroom.
  return story.source.id === 'community-impact' && place === 'The Colony';
}

function finish(story: Omit<ExternalStory, 'place' | 'sponsored'>): ExternalStory {
  const place = placeOf(story.title, story.summary);
  return { ...story, place, sponsored: isSponsored(story, place) };
}

const TTL = 10 * 60 * 1000;
// Only stories that name a place in the county. "The Colony" here is the Bastrop subdivision, because these feeds are already county sections.
const aboutBastrop = /\b(bastrop|elgin|smithville|rosanky|cedar creek|tahitian village|the colony|paige|mcdade|red rock)\b/i;
// Outlets also tag stories with a town, so a "Bastrop" or "Elgin" tag counts. The broad "Bastrop County" tag alone does not.
const townTag = /^(bastrop|elgin|smithville|rosanky|cedar creek|tahitian village|the colony|paige|mcdade|red rock)$/i;

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

/** A feed often stops mid-word. Keep a finished sentence, or drop a short leftover stub. */
export function closeSummary(value: string) {
  const text = value.trim();
  if (!text || /[.!?…]["')\]]?$/.test(text)) return text;
  const end = Math.max(text.lastIndexOf('. '), text.lastIndexOf('! '), text.lastIndexOf('? '));
  const before = end >= 0 ? text.slice(0, end + 1) : '';
  const abbreviation = /\b(Jan|Feb|Mar|Apr|Aug|Sept|Sep|Oct|Nov|Dec|Mr|Mrs|Ms|Dr|St|Jr|Sr|U\.S|a\.m|p\.m)\.$/;
  if (end >= 40 && !abbreviation.test(before)) return before;
  const last = text.match(/\S+$/)?.[0] ?? '';
  if (!/^[a-z]{1,4}$/.test(last)) return text;
  const whole = text.replace(/\s+\S*$/, '').replace(/\s+(and|or|the|a|an|to|of|for|with|in|on|at)$/i, '');
  return whole ? `${whole}…` : text;
}

function plain(value: string, max: number) {
  const text = decode(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, '') : text;
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
    stories.push(
      finish({
        title,
        link: url.toString(),
        published,
        categories: tags(block, 'category').map((value) => plain(value, 40)).filter(Boolean),
        author: plain(tags(block, 'dc:creator')[0] ?? '', 80),
        summary: closeSummary(plain(tags(block, 'description')[0] ?? '', 220)),
        source: { id: source.id, name: source.name, home: source.home },
      }),
    );
  }
  return stories;
}

const metroRoundup = /\baustin[-\s]?(area|metro)\b/i;

function isLocal(story: ExternalStory) {
  const text = `${story.title} ${story.summary}`;
  if (aboutBastrop.test(text) || story.categories.some((category) => townTag.test(category))) return true;
  // The Bastrop–Cedar Creek edition files some local stories without repeating the town name.
  if (story.source.id === 'community-impact' && story.link.includes('/bastrop-cedar-creek/')) {
    // The section path contains "bastrop", so judge Austin roundups by the headline itself.
    if (metroRoundup.test(story.title)) return aboutBastrop.test(text);
    return true;
  }
  // The Courier’s article feed is the Elgin paper. A column can omit the town name.
  if (story.source.id === 'elgin-courier') return true;
  return false;
}

async function loadSource(source: NewsSource): Promise<ExternalStory[]> {
  const hit = cache.get(source.id);
  if (hit && Date.now() - hit.at < TTL) return hit.items;
  try {
    const response = await fetch(source.feed, {
      headers: {
        'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)',
        accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`${source.name} feed returned ${response.status}`);
    const body = await response.text();
    const items = parseFeed(body, source).filter(isLocal);
    cache.set(source.id, { at: Date.now(), items });
    return items;
  } catch (error) {
    console.error(`${source.name} feed failed`, error instanceof Error ? error.message : error);
    // Keep serving the last good copy, and retry in a minute rather than on every request.
    cache.set(source.id, { at: Date.now() - TTL + 60_000, items: hit?.items ?? [] });
    return hit?.items ?? [];
  }
}

/**
 * Bastrop County stories from every configured outlet, newest first. Each outlet is cached ten minutes and fails on its own.
 * `perSource` caps how many stories one outlet can contribute, so a busy outlet cannot crowd out the others.
 */
function takeSource(items: ExternalStory[], perSource: number) {
  const sorted = [...items].sort((a, b) => b.published.getTime() - a.published.getTime());
  if (!Number.isFinite(perSource) || sorted.length <= perSource) return sorted;
  const picked = sorted.slice(0, perSource);
  const links = new Set(picked.map((story) => story.link));
  const gap = sorted.find((story) => !links.has(story.link) && gapPlaces.has(story.place));
  // Keep one story from a town that has no paper of its own, even when newer county news would crowd it out.
  if (gap) picked[picked.length - 1] = gap;
  return picked;
}

export async function getExternalNews(limit = 8, perSource = Infinity, matching?: RegExp, wires = false): Promise<ExternalStory[]> {
  const sources = wires ? newsSources : newsSources.filter((source) => !source.wire);
  const lists = await Promise.all(sources.map(loadSource));
  const seen = new Set<string>();
  const seenTitles = new Set<string>();
  return lists
    .map((items) => (matching ? items.filter((story) => matching.test(`${story.title} ${story.summary}`)) : items))
    .flatMap((items) => takeSource(items, perSource))
    .sort((a, b) => b.published.getTime() - a.published.getTime())
    .filter((story) => {
      const title = story.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(story.link) || seenTitles.has(title)) return false;
      seen.add(story.link);
      seenTitles.add(title);
      return true;
    })
    .slice(0, limit);
}
