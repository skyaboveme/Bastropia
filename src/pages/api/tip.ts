import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { env } from 'cloudflare:workers';
import { saveIntake, type IntakeRecord } from '../../lib/intake';

export const prerender = false;

type Kv = {
  put(key: string, value: ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
};

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

function clean(value: unknown, max = 400) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function httpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export const POST: APIRoute = async ({ request }) => {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 4_500_000) return bounce('/tips?error=photo');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bounce('/tips?error=form');
  }

  if (clean(form.get('company_website'))) return bounce('/thanks');

  const email = clean(form.get('email'), 160).toLowerCase();
  const body = clean(form.get('body'), 1500);
  const place = clean(form.get('place'), 40);
  const contact = clean(form.get('contact'), 80);
  const photoUrl = httpUrl(clean(form.get('photoUrl'), 300));
  const share = form.get('share') === 'yes' ? 'yes' : 'no';

  if (!emailOk(email)) return bounce('/tips?error=email');
  if (body.length < 20 || !place) return bounce('/tips?error=details');

  const id = `BAS-${randomBytes(4).toString('hex').toUpperCase()}`;
  const fields: Record<string, string> = {
    email,
    body,
    place,
    share,
  };
  if (contact) fields.contact = contact;
  if (photoUrl) fields.photoUrl = photoUrl;

  const photo = form.get('photo');
  if (photo && typeof photo !== 'string' && 'arrayBuffer' in photo && photo.size > 0) {
    if (photo.size > 4_000_000) return bounce('/tips?error=photo');
    const type = photo.type || 'image/jpeg';
    if (!/^image\/(jpeg|png|webp)$/.test(type)) return bounce('/tips?error=photo');
    const store = (env as { SESSION?: Kv }).SESSION;
    if (store) {
      const bytes = await photo.arrayBuffer();
      const key = `tip:image:${id}`;
      await store.put(key, bytes, { httpMetadata: { contentType: type } });
      fields.photoKey = key;
      fields.photoType = type;
    } else {
      fields.photoNote = 'Photo received but could not be stored on this host.';
    }
  }

  const record: IntakeRecord = {
    id,
    type: 'tip',
    createdAt: new Date().toISOString(),
    status: 'pending',
    total: 0,
    summary: `Tip from ${place}: ${body.slice(0, 80)}`,
    fields,
  };

  try {
    await saveIntake(record);
  } catch {
    return bounce('/tips?error=save');
  }

  return bounce(`/thanks?id=${id}`);
};
