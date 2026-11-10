import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getIntake } from '../../../lib/intake';

export const prerender = false;

type Kv = {
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
};

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  if (!/^BAS-[A-F0-9]{8}$/.test(id)) return new Response('Not found', { status: 404 });
  const record = await getIntake(id);
  if (!record || record.type !== 'tip' || !record.fields.photoKey) {
    return new Response('Not found', { status: 404 });
  }
  const store = (env as { SESSION?: Kv }).SESSION;
  if (!store) return new Response('Not found', { status: 404 });
  const bytes = await store.get(record.fields.photoKey, 'arrayBuffer');
  if (!bytes) return new Response('Not found', { status: 404 });
  return new Response(bytes, {
    headers: {
      'Content-Type': record.fields.photoType || 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  });
};
