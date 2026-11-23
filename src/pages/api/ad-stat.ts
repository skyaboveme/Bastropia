import type { APIRoute } from 'astro';
import { recordDirectoryStat, recordStat } from '../../lib/ads';
import { recordBannerView } from '../../lib/businessDb';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const origin = request.headers.get('origin') || '';
  const referrer = request.headers.get('referer') || '';
  const sameHost = origin === url.origin || referrer.startsWith(url.origin);
  if (!sameHost) return new Response(null, { status: 204 });
  const form = await request.formData();
  const id = String(form.get('id') || '');
  const placement = String(form.get('placement') || '');
  const kind = form.get('kind') === 'clicks' ? 'clicks' : 'impressions';
  const counted = kind === 'impressions' ? await recordStat(id, placement, 'impressions') : false;
  if (!counted) {
    const directory = await recordDirectoryStat(id, placement, kind);
    if (!directory && kind === 'impressions') await recordBannerView(id, placement);
  }
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
};
