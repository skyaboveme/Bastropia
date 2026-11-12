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
  if (input.company_website) return bounce('/thanks');
  const digits = (input.phone || '').replace(/\D/g, '');
  if (!input.business || !input.category || !input.city || digits.length < 10 || !input.email || (input.details || '').trim().length < 20) {
    return bounce('/businesses/submit?error=details');
  }
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
      status: 'pending',
    });
    await notifyFormspree({
      email: row.email,
      subject: formspreeSubject('business', `${row.name} (${row.category}) in ${row.city}`),
      fields: {
        type: 'business',
        id: row.id,
        summary: `${row.name} waiting for approval`,
        ...input,
      },
    });
    return bounce(`/thanks?id=${row.id}&kind=business`);
  } catch {
    return bounce('/businesses/submit?error=save');
  }
};
