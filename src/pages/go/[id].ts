import type { APIRoute } from 'astro';
import { destinationFor, recordStat } from '../../lib/ads';

export const prerender = false;

export const GET: APIRoute = async ({ params, request, url }) => {
  const id = params.id || '';
  const placement = url.searchParams.get('from') || '';
  const href = await destinationFor(id, placement);
  if (!href) return new Response('That ad is not on the site.', { status: 404 });
  const mode = request.headers.get('sec-fetch-mode');
  if (mode === null || mode === 'navigate') await recordStat(id, placement, 'clicks');
  return new Response(null, {
    status: 302,
    headers: {
      Location: href,
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
    },
  });
};
