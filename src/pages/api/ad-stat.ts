import type { APIRoute } from 'astro';
import { recordStat } from '../../lib/ads';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const origin = request.headers.get('origin') || '';
  const referrer = request.headers.get('referer') || '';
  const sameHost = origin === url.origin || referrer.startsWith(url.origin);
  if (!sameHost) return new Response(null, { status: 204 });
  const form = await request.formData();
  await recordStat(String(form.get('id') || ''), String(form.get('placement') || ''), 'impressions');
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
};
