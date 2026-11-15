import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteName, siteUrl } from '../data/site';

export const prerender = false;

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Google News only wants stories from the last two days. */
export const GET: APIRoute = async () => {
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const stories = (await getCollection('news'))
    .filter((story) => story.data.pubDate.getTime() >= cutoff)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const urls = stories
    .map((story) => {
      const loc = xml(new URL(`/news/${story.id}`, siteUrl).toString());
      return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${xml(siteName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${story.data.pubDate.toISOString()}</news:publication_date>
      <news:title>${xml(story.data.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
    },
  });
};
