import type { APIRoute } from 'astro';
import { llmsIndex } from '../lib/llmsGuide';

export const GET: APIRoute = async () => {
  return new Response(await llmsIndex(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
