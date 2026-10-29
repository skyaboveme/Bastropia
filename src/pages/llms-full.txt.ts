import type { APIRoute } from 'astro';
import { llmsFull } from '../lib/llmsGuide';

export const GET: APIRoute = async () => {
  return new Response(await llmsFull(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
