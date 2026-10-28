import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { deskAuthorized } from '../../lib/auth';
import {
  getIntake,
  paidTier,
  placeSponsor,
  placeUpgrade,
  placementId,
  updateIntakeStatus,
} from '../../lib/intake';
import { addDays, eventKey } from '../../lib/time';

export const prerender = false;

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

function same(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const form = await request.formData();
  const action = String(form.get('action') || '');

  if (action === 'login') {
    const key = process.env.BASTROPIA_DESK_KEY;
    const password = String(form.get('password') || '');
    if (!key || !same(password, key)) return bounce('/desk?error=auth');
    cookies.set('bastropia_desk', key, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
      secure: url.protocol === 'https:',
    });
    return bounce('/desk');
  }

  if (!deskAuthorized(url.hostname, cookies.get('bastropia_desk')?.value)) {
    return bounce('/desk?error=auth');
  }

  const id = String(form.get('id') || '');
  if (action === 'decline') {
    await updateIntakeStatus(id, 'declined');
    return bounce('/desk');
  }

  const record = await getIntake(id);
  if (!record) return bounce('/desk');

  if (action === 'place' && record.type === 'ad') {
    const placement = placementId(record.fields.placement);
    if (!placement || !record.fields.until) return bounce('/desk');
    await placeSponsor({
      orderId: record.id,
      placement,
      name: record.fields.business,
      line: record.fields.line,
      href: record.fields.website,
      until: record.fields.until,
    });
    await updateIntakeStatus(id, 'scheduled');
  }

  if (action === 'upgrade' && record.type === 'upgrade') {
    const tier = paidTier(record.fields.tier);
    const days = Number(record.fields.days) || 7;
    if (!tier || !record.fields.eventId) return bounce('/desk');
    await placeUpgrade({
      orderId: record.id,
      eventId: record.fields.eventId,
      tier,
      until: addDays(eventKey(new Date()), days),
    });
    await updateIntakeStatus(id, 'scheduled');
  }

  return bounce('/desk');
};
