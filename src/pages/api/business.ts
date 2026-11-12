import type { APIRoute } from 'astro';
import {
  accountFromToken,
  addBizEvent,
  addSpecial,
  businessCookieName,
  deleteBizEvent,
  deleteSpecial,
  loginAccount,
  logoutToken,
  updateBusiness,
} from '../../lib/businessDb';

export const prerender = false;

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const form = await request.formData();
  const action = String(form.get('action') || '');
  const secure = url.protocol === 'https:';

  if (action === 'login') {
    const session = await loginAccount(String(form.get('username') || ''), String(form.get('password') || ''));
    if (!session) return bounce('/business?error=login');
    cookies.set(businessCookieName(), session.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
      secure,
    });
    return bounce('/business');
  }

  const token = cookies.get(businessCookieName())?.value;
  if (action === 'logout') {
    await logoutToken(token);
    cookies.delete(businessCookieName(), { path: '/' });
    return bounce('/business');
  }

  const current = await accountFromToken(token);
  if (!current) return bounce('/business?error=auth');
  const businessId = current.business.id;

  try {
    if (action === 'save') {
      await updateBusiness(businessId, {
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
      });
    }
    if (action === 'special') {
      const title = String(form.get('title') || '');
      const details = String(form.get('details') || '');
      if (title && details) await addSpecial(businessId, title, details, String(form.get('starts') || ''), String(form.get('ends') || ''));
    }
    if (action === 'delete-special') await deleteSpecial(businessId, String(form.get('id') || ''));
    if (action === 'event') {
      const title = String(form.get('title') || '');
      const starts = String(form.get('starts') || '');
      if (title && starts) {
        await addBizEvent(businessId, {
          title,
          starts,
          ends: String(form.get('ends') || ''),
          venue: String(form.get('venue') || ''),
          details: String(form.get('details') || ''),
        });
      }
    }
    if (action === 'delete-event') await deleteBizEvent(businessId, String(form.get('id') || ''));
  } catch {
    return bounce('/business?error=save');
  }
  return bounce('/business');
};
