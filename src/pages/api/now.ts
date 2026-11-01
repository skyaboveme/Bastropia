export const prerender = false;

import type { APIRoute } from 'astro';
import { getCountyNow } from '../../lib/countyNow';

export const GET: APIRoute = async () => {
  const now = await getCountyNow();
  return new Response(JSON.stringify(now), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=120',
    },
  });
};
