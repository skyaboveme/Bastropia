import type { APIRoute } from 'astro';
import { insertBusiness } from '../../lib/businessDb';
import { formspreeSubject, notifyFormspree } from '../../lib/formspree';

export const prerender = false;

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const input: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') input[key] = value;
  }
  if (input.bastro_hp || input.company_website) return bounce('/thanks');
  const digits = (input.phone || '').replace(/\D/g, '');
  if (!input.business || !input.category || !input.city || digits.length < 10 || !input.email || (input.details || '').trim().length < 20) {
    return bounce('/directory/submit?error=details');
  }
  let id = '';
  try {
    const row = await insertBusiness({
      name: input.business,
      category: input.category,
      city: input.city,
      areas: input.areas,
      phone: input.phone,
      website: input.website,
      email: input.email,
      contact: input.contact,
      address: input.address,
      details: input.details,
      hours: input.hours,
      status: 'pending',
    });
    id = row.id;
  } catch {
    id = '';
  }
  const summary = `${input.business} (${input.category}) in ${input.city}`;
  const emailed = await notifyFormspree({
    email: input.email,
    subject: formspreeSubject('business', summary),
    fields: {
      type: 'business',
      id,
      summary: `${input.business} waiting for approval`,
      business: input.business,
      category: input.category,
      city: input.city,
      areas: input.areas || '',
      phone: input.phone,
      website: input.website || '',
      contact: input.contact || '',
      address: input.address || '',
      hours: input.hours || '',
      details: input.details,
    },
  });
  if (!emailed) return bounce('/directory/submit?error=save');
  return bounce(id ? `/thanks?id=${id}&kind=business` : '/thanks?kind=business');
};
