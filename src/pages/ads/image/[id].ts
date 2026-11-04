import type { APIRoute } from 'astro';
import { imageFor } from '../../../lib/ads';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const image = await imageFor(params.id || '');
  if (!image) return new Response(null, { status: 404 });
  return new Response(image.bytes, {
    headers: {
      'content-type': image.type,
      'cache-control': 'public, max-age=300',
    },
  });
};
