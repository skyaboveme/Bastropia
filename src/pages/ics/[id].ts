import type { APIRoute } from 'astro';
import { buildIcs } from '../../lib/ics';
import { legacyEventRedirect, listEvents } from '../../lib/eventSource';

export const prerender = false;

export const GET: APIRoute = async ({ params, site, redirect }) => {
  const id = params.id ?? '';
  const target = await legacyEventRedirect(id);
  if (target) return redirect(target, 301);
  const { events } = await listEvents();
  const event = events.find((item) => item.id === id);
  if (!event) return new Response('Not found', { status: 404 });
  const pageUrl = new URL(`/events/${id}`, site).toString();
  return new Response(buildIcs(event, pageUrl), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${id}.ics"`,
    },
  });
};
