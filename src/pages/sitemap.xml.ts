import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { businesses } from '../data/businesses';
import { siteUrl } from '../data/site';
import { listLiveBusinesses } from '../lib/businessDb';

export const prerender = false;

type Entry = { path: string; lastmod?: Date; priority?: string };

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stamp(date: Date) {
  return date.toISOString().slice(0, 10);
}

function row({ path, lastmod, priority }: Entry) {
  const loc = xml(new URL(path, siteUrl).toString());
  const when = lastmod ? `\n    <lastmod>${stamp(lastmod)}</lastmod>` : '';
  const rank = priority ? `\n    <priority>${priority}</priority>` : '';
  return `  <url>\n    <loc>${loc}</loc>${when}${rank}\n  </url>`;
}

const hubs: Entry[] = [
  { path: '/', priority: '1.0' },
  { path: '/events', priority: '0.9' },
  { path: '/news', priority: '0.9' },
  { path: '/development', priority: '0.9' },
  { path: '/this-weekend', priority: '0.9' },
  { path: '/scores', priority: '0.8' },
  { path: '/results', priority: '0.8' },
  { path: '/videos', priority: '0.8' },
  { path: '/weather', priority: '0.8' },
  { path: '/government', priority: '0.8' },
  { path: '/government/court-decisions', priority: '0.7' },
  { path: '/new-here', priority: '0.8' },
  { path: '/groups', priority: '0.8' },
  { path: '/social', priority: '0.8' },
  { path: '/schools', priority: '0.8' },
  { path: '/alerts', priority: '0.8' },
  { path: '/roads', priority: '0.8' },
  { path: '/phone-numbers', priority: '0.8' },
  { path: '/burn-ban', priority: '0.8' },
  { path: '/calendar', priority: '0.7' },
  { path: '/about', priority: '0.6' },
  { path: '/advertise', priority: '0.6' },
  { path: '/newsletter', priority: '0.7' },
  { path: '/businesses', priority: '0.7' },
  { path: '/businesses/submit', priority: '0.6' },
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
  const [events, news, social, updates, listed] = await Promise.all([
    getCollection('events'),
    getCollection('news'),
    getCollection('social'),
    getCollection('updates'),
    listLiveBusinesses(),
  ]);

  const entries: Entry[] = [
    ...hubs,
    ...businesses.map((business) => ({ path: `/${business.slug}`, priority: '0.6' })),
    ...listed.map((business) => ({ path: `/businesses/l/${business.slug}`, priority: '0.6' })),
    ...events.map((event) => ({
      path: `/events/${event.id}`,
      lastmod: event.data.start,
      priority: '0.8',
    })),
    ...news.map((story) => ({
      path: `/news/${story.id}`,
      lastmod: story.data.pubDate,
      priority: '0.7',
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

  const seen = new Set<string>();
  const unique = entries.filter((entry) => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${siteUrl}/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
