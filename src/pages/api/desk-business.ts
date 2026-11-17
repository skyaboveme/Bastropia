import type { APIRoute } from 'astro';
import { deskAuthorized } from '../../lib/auth';
import { insertBusiness, readLogoFile, setAccount, storeLogo, updateBusiness } from '../../lib/businessDb';

export const prerender = false;

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

function fields(form: FormData) {
  return {
    slug: String(form.get('slug') || ''),
    name: String(form.get('name') || ''),
    category: String(form.get('category') || ''),
    city: String(form.get('city') || ''),
    areas: String(form.get('areas') || ''),
    phone: String(form.get('phone') || ''),
    website: String(form.get('website') || ''),
    email: String(form.get('email') || ''),
    contact: String(form.get('contact') || ''),
    address: String(form.get('address') || ''),
    hours: String(form.get('hours') || ''),
    daily_special: String(form.get('daily_special') || ''),
    banner_url: String(form.get('banner_url') || ''),
    banner_placement: String(form.get('banner_placement') || ''),
    details: String(form.get('details') || ''),
  };
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!deskAuthorized(url.hostname, cookies.get('bastropia_desk')?.value)) return bounce('/desk?error=auth');
  const form = await request.formData();
  const action = String(form.get('action') || '');
  const existingId = String(form.get('id') || '');
  const back = existingId ? `/desk/businesses/${existingId}` : '/desk/businesses';
  try {
    const logo = await readLogoFile(form.get('logo'));
    const removeLogo = form.get('remove_logo') === 'yes';
    if (action === 'create') {
      const row = await insertBusiness({ ...fields(form), status: 'live' });
      if (logo) await storeLogo(row.id, logo);
      const username = String(form.get('username') || '');
      const password = String(form.get('password') || '');
      if (username || password) await setAccount(row.id, username, password);
      return bounce(`/desk/businesses/${row.id}?saved=1`);
    }
    if (action === 'save' || action === 'approve') {
      const row = await updateBusiness(existingId, { ...fields(form), status: 'live' });
      if (!row) return bounce(`${back}?error=save`);
      if (logo || removeLogo) await storeLogo(existingId, logo, removeLogo && !logo);
      const username = String(form.get('username') || '');
      const password = String(form.get('password') || '');
      if (username || password) await setAccount(row.id, username, password);
      return bounce(`/desk/businesses/${row.id}?saved=1`);
    }
    if (action === 'hide' || action === 'live') {
      await updateBusiness(existingId, { status: action === 'hide' ? 'hidden' : 'live' });
      return bounce(`${back}?saved=1`);
    }
    if (action === 'password') {
      await setAccount(existingId, String(form.get('username') || ''), String(form.get('password') || ''));
      return bounce(`${back}?saved=1`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const reason = message === 'username' || message === 'password' || message === 'image' ? message : 'save';
    return bounce(`${back}?error=${reason}`);
  }
  return bounce('/desk/businesses');
};
