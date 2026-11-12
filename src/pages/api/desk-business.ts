import type { APIRoute } from 'astro';
import { deskAuthorized } from '../../lib/auth';
import { insertBusiness, setAccount, updateBusiness } from '../../lib/businessDb';

export const prerender = false;

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!deskAuthorized(url.hostname, cookies.get('bastropia_desk')?.value)) return bounce('/desk?error=auth');
  const form = await request.formData();
  const action = String(form.get('action') || '');
  try {
    if (action === 'create' || action === 'approve') {
      const existingId = String(form.get('id') || '');
      const row = existingId
        ? await updateBusiness(existingId, {
            name: String(form.get('name') || ''),
            category: String(form.get('category') || ''),
            city: String(form.get('city') || ''),
            areas: String(form.get('areas') || ''),
            phone: String(form.get('phone') || ''),
            website: String(form.get('website') || ''),
            email: String(form.get('email') || ''),
            contact: String(form.get('contact') || ''),
            address: String(form.get('address') || ''),
            details: String(form.get('details') || ''),
            status: 'live',
          })
        : await insertBusiness({
            name: String(form.get('name') || ''),
            category: String(form.get('category') || ''),
            city: String(form.get('city') || ''),
            areas: String(form.get('areas') || ''),
            phone: String(form.get('phone') || ''),
            website: String(form.get('website') || ''),
            email: String(form.get('email') || ''),
            contact: String(form.get('contact') || ''),
            address: String(form.get('address') || ''),
            details: String(form.get('details') || ''),
            status: 'live',
          });
      if (!row) return bounce('/desk/businesses?error=save');
      const username = String(form.get('username') || '');
      const password = String(form.get('password') || '');
      if (username || password) await setAccount(row.id, username, password);
      return bounce(`/desk/businesses?saved=${row.slug}`);
    }
    if (action === 'hide' || action === 'live') {
      await updateBusiness(String(form.get('id') || ''), { status: action === 'hide' ? 'hidden' : 'live' });
    }
    if (action === 'password') {
      await setAccount(String(form.get('id') || ''), String(form.get('username') || ''), String(form.get('password') || ''));
    }
  } catch (error) {
    const reason = error instanceof Error && (error.message === 'username' || error.message === 'password') ? error.message : 'save';
    return bounce(`/desk/businesses?error=${reason}`);
  }
  return bounce('/desk/businesses');
};
