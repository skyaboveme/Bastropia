export const prerender = false;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteUrl } from '../data/site';
import { getExternalNews } from '../lib/externalNews';

type Item = { title: string; link: string; date: Date; summary: string; source: string };

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cdata(value: string) {
  return value.replace(/]]>/g, ']] >');
}

export const GET: APIRoute = async () => {
  const [desk, notices, external] = await Promise.all([
    getCollection('news'),
    getCollection('updates'),
    getExternalNews(80, 12, undefined, true),
  ]);
  const items: Item[] = [
    ...desk.map((story) => ({
      title: story.data.title,
      link: new URL(`/news/${story.id}`, siteUrl).toString(),
      date: story.data.pubDate,
      summary: story.data.description,
      source: 'Bastropia',
    })),
    ...notices.map((notice) => ({
      title: notice.data.title,
      link: new URL(`/government/${notice.id}`, siteUrl).toString(),
      date: notice.data.pubDate,
      summary: notice.data.description,
      source: notice.data.agency,
    })),
    ...external.map((story) => ({
      title: story.title,
      link: story.link,
      date: story.published,
      summary: story.summary,
      source: story.sponsored ? `${story.source.name} · Sponsored` : story.source.name,
    })),
  ];
  const seen = new Set<string>();
  const body = items
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .filter((item) => {
      const key = item.link;
      const title = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key) || seen.has(title)) return false;
      seen.add(key);
      seen.add(title);
      return true;
    })
    .slice(0, 60)
    .map((item) => {
      const summary = item.summary ? `${item.source}. ${item.summary}` : item.source;
      return `<item><title><![CDATA[${cdata(item.title)}]]></title><link>${escapeXml(item.link)}</link><guid isPermaLink="true">${escapeXml(item.link)}</guid><pubDate>${item.date.toUTCString()}</pubDate><category>${escapeXml(item.source)}</category><description><![CDATA[${cdata(summary)}]]></description></item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Bastrop County</title><link>${siteUrl}</link><description>News in Bastrop County from Bastropia, the county papers, and Austin newsrooms when a story names the county or a town in it.</description><language>en-us</language>${body}</channel></rss>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
};
