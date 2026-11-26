import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { authors } from '../data/authors';
import { businesses } from '../data/businesses';
import { siteUrl } from '../data/site';
import { listLiveBusinesses } from '../lib/businessDb';
import { listEvents } from '../lib/eventSource';

export const prerender = false;

type Entry = { path: string; lastmod?: Date; priority?: string; image?: string };

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stamp(date: Date) {
  return date.toISOString().slice(0, 10);
}

function row({ path, lastmod, priority, image }: Entry) {
  const loc = xml(new URL(path, siteUrl).toString());
  const when = lastmod ? `\n    <lastmod>${stamp(lastmod)}</lastmod>` : '';
  const rank = priority ? `\n    <priority>${priority}</priority>` : '';
  const picture =
    image && (image.startsWith('/') || image.startsWith('http'))
      ? `\n    <image:image>\n      <image:loc>${xml(new URL(image, siteUrl).toString())}</image:loc>\n    </image:image>`
      : '';
  return `  <url>\n    <loc>${loc}</loc>${when}${rank}${picture}\n  </url>`;
}

const hubs: Entry[] = [
  { path: '/', priority: '1.0' },
  { path: '/events', priority: '0.9' },
  { path: '/news', priority: '0.9' },
  { path: '/guides', priority: '0.8' },
  { path: '/development', priority: '0.9' },
  { path: '/this-weekend', priority: '0.9' },
  { path: '/scores', priority: '0.8' },
  { path: '/results', priority: '0.8' },
  { path: '/videos', priority: '0.8' },
  { path: '/weather', priority: '0.8' },
  { path: '/now', priority: '0.8' },
  { path: '/metrics', priority: '0.8' },
  { path: '/cattle', priority: '0.8' },
  { path: '/heb-specials', priority: '0.7' },
  { path: '/government', priority: '0.8' },
  { path: '/government/court-decisions', priority: '0.7' },
  { path: '/new-here', priority: '0.8' },
  { path: '/groups', priority: '0.8' },
  { path: '/schools', priority: '0.8' },
  { path: '/alerts', priority: '0.8' },
  { path: '/roads', priority: '0.8' },
  { path: '/phone-numbers', priority: '0.8' },
  { path: '/burn-ban', priority: '0.8' },
  { path: '/about', priority: '0.6' },
  { path: '/staff', priority: '0.5' },
  { path: '/authors', priority: '0.4' },
  { path: '/editorial-policy', priority: '0.5' },
  { path: '/corrections-policy', priority: '0.5' },
  { path: '/corrections', priority: '0.5' },
  { path: '/contact', priority: '0.5' },
  { path: '/advertise', priority: '0.6' },
  { path: '/newsletter', priority: '0.7' },
  { path: '/directory', priority: '0.7' },
  { path: '/eats', priority: '0.7' },
  { path: '/churches', priority: '0.8' },
  { path: '/directory/submit', priority: '0.6' },
  { path: '/submit', priority: '0.6' },
  { path: '/tips', priority: '0.6' },
  { path: '/upgrade', priority: '0.6' },
  { path: '/bastrop', priority: '0.8' },
  { path: '/elgin', priority: '0.8' },
  { path: '/smithville', priority: '0.8' },
  { path: '/cedar-creek', priority: '0.8' },
  { path: '/mcdade', priority: '0.8' },
  { path: '/paige', priority: '0.8' },
  { path: '/rss.xml', priority: '0.5' },
  { path: '/events.xml', priority: '0.5' },
  { path: '/llms.txt', priority: '0.4' },
  { path: '/llms-full.txt', priority: '0.4' },
  { path: '/sitemap', priority: '0.3' },
];

export const GET: APIRoute = async () => {
  const [{ events, source }, news, social, updates, guides, listed] = await Promise.all([
    listEvents(),
    getCollection('news'),
    getCollection('social'),
    getCollection('updates'),
    getCollection('guides'),
    listLiveBusinesses(),
  ]);

  const entries: Entry[] = [
    ...hubs,
    ...businesses.map((business) => ({ path: `/${business.slug}`, priority: '0.6' })),
    ...authors.map((author) => ({ path: `/authors/${author.slug}`, priority: '0.4' })),
    ...listed.map((business) => ({ path: `/${business.slug}`, priority: '0.6' })),
    ...(source === 'bcc'
      ? []
      : events.map((event) => ({
          path: `/events/${event.id}`,
          lastmod: event.data.start,
          priority: '0.8',
          image: event.data.image,
        }))),
    ...news.map((story) => ({
      path: `/news/${story.id}`,
      lastmod: story.data.updated ?? story.data.pubDate,
      priority: '0.7',
      image: story.data.image,
    })),
    ...guides.map((guide) => ({
      path: `/guides/${guide.id}`,
      lastmod: guide.data.updated,
      priority: '0.8',
      image: guide.data.heroImage,
    })),
    ...social.map((item) => ({
      path: `/social/${item.id}`,
      lastmod: item.data.pubDate,
      priority: '0.6',
    })),
    ...updates.map((item) => ({
      path: `/government/${item.id}`,
      lastmod: item.data.pubDate,
      priority: '0.7',
    })),
  ];

  const newest = news.reduce<Date | undefined>((latest, story) => {
    if (!latest || story.data.pubDate > latest) return story.data.pubDate;
    return latest;
  }, undefined);
  if (newest) entries[0] = { ...entries[0], lastmod: newest };

  const seen = new Set<string>();
  const unique = entries.filter((entry) => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${siteUrl}/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${unique.map(row).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
