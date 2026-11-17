import type { APIRoute } from 'astro';
import { getBusiness } from '../../../lib/businessDb';
import { sessionKv } from '../../../lib/sessionKv';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  if (!/^biz[a-f0-9]{12}$/.test(id)) return new Response('Not found', { status: 404 });
  const business = await getBusiness(id);
  if (!business?.logo_type) return new Response('Not found', { status: 404 });
  const bytes = await sessionKv()?.get(`biz:logo:${id}`, 'arrayBuffer');
  if (!bytes) return new Response('Not found', { status: 404 });
  return new Response(bytes, {
    headers: {
      'Content-Type': business.logo_type,
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
