import type { APIRoute } from 'astro';
import { siteDescription, siteUrl } from '../data/site';
import { eventHref, listEvents } from '../lib/eventSource';
import { eventKey, whenLabel } from '../lib/time';

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const GET: APIRoute = async () => {
  const today = eventKey(new Date());
  const { events: all, source } = await listEvents();
  const events = all
    .filter((event) => eventKey(event.data.start) >= today)
    .sort((a, b) => a.data.start.getTime() - b.data.start.getTime())
    .slice(0, 80);
  const items = events
    .map((event) => {
      const href = eventHref(event, source);
      const link = href.startsWith('http') ? href : new URL(href, siteUrl).toString();
      const when = whenLabel(event.data.schedule, event.data.start, event.data.end);
      const description = `${when}. ${event.data.city}. ${event.data.venue}. ${event.data.summary}`;
      return `<item><title><![CDATA[${event.data.title}]]></title><link>${xml(link)}</link><pubDate>${event.data.start.toUTCString()}</pubDate><description><![CDATA[${description}]]></description></item>`;
    })
    .join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Bastropia events</title><link>${siteUrl}/events</link><description>${xml(siteDescription)}</description><language>en-us</language>${items}</channel></rss>`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
