import type { APIRoute } from 'astro';
import { bumpStat, getBusiness } from '../../../lib/businessDb';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const business = await getBusiness(params.id ?? '');
  if (!business || business.status !== 'live') return new Response(null, { status: 404 });
  const to = url.searchParams.get('to');
  if (to === 'site' && business.website) {
    await bumpStat(business.id, 'site_clicks');
    return Response.redirect(business.website, 302);
  }
  if (to === 'phone') {
    await bumpStat(business.id, 'phone_clicks');
    const digits = business.phone.replace(/\D/g, '');
    const tel = digits.length === 10 ? `tel:+1${digits}` : `tel:${digits}`;
    return Response.redirect(tel, 302);
  }
  return Response.redirect(`/businesses/l/${business.slug}`, 302);
};
