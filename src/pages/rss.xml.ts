import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const stories = (await getCollection('news')).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  const origin = site?.href ?? 'https://bastropia.com/';
  const items = stories
    .map((story) => {
      const link = new URL(`/news/${story.id}`, origin).toString();
      return `<item><title><![CDATA[${story.data.title}]]></title><link>${link}</link><pubDate>${story.data.pubDate.toUTCString()}</pubDate><description><![CDATA[${story.data.description}]]></description></item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Bastropia</title><link>${origin}</link><description>News for Bastrop County, Texas</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
