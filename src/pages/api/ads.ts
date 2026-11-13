import type { APIRoute } from 'astro';
import { createAdvertiser, deleteAdvertiser, saveFileContact, setShowing, updateAdvertiser } from '../../lib/ads';
import { deskAuthorized } from '../../lib/auth';

export const prerender = false;

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!deskAuthorized(url.hostname, cookies.get('bastropia_desk')?.value)) return bounce('/desk/ads?error=auth');
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 2_000_000) return bounce('/desk/ads?error=image');
  const form = await request.formData();
  const action = String(form.get('action') || '');
  const id = String(form.get('id') || '');

  if (action === 'contact') {
    const saved = await saveFileContact(id, String(form.get('contact') || ''));
    return bounce(saved ? '/desk/ads?saved=1' : '/desk/ads?error=save');
  }

  if (action === 'hold' || action === 'release') {
    const saved = await setShowing(id, action === 'release');
    return bounce(saved ? '/desk/ads?saved=1' : '/desk/ads?error=save');
  }

  if (action === 'delete') {
    if (form.get('confirm') !== 'yes') return bounce('/desk/ads?error=confirm');
    const saved = await deleteAdvertiser(id);
    return bounce(saved ? '/desk/ads?saved=1' : '/desk/ads?error=save');
  }

  const result = action === 'save' ? await updateAdvertiser(id, form) : await createAdvertiser(form);
  if (!result.ok) return bounce(`/desk/ads?error=${result.error}`);
  return bounce('/desk/ads?saved=1');
};
