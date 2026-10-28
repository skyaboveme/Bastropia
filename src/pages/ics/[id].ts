import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildIcs } from '../../lib/ics';

export async function getStaticPaths() {
  const events = await getCollection('events');
  return events.map((event) => ({ params: { id: event.id }, props: { event } }));
}

export const GET: APIRoute = ({ props, site, params }) => {
  const pageUrl = new URL(`/events/${params.id}`, site).toString();
  return new Response(buildIcs(props.event, pageUrl), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${params.id}.ics"`,
    },
  });
};
