import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { saveAlertSubscriptions } from '../../lib/alertStore';
import { formspreeSubject, formspreeIntakeTypes, notifyFormspree } from '../../lib/formspree';
import { buildRecord, saveIntake, tagAlert } from '../../lib/intake';

export const prerender = false;

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

const origins = new Set(['/', '/advertise', '/upgrade', '/submit', '/alerts', '/businesses/submit']);

export const POST: APIRoute = async ({ request }) => {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 30_000) return bounce('/submit?error=form');
  const form = await request.formData();
  const input: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') input[key] = value;
  }
  const from = origins.has(input.from) ? input.from : '/';
  if (input.company_website) return bounce('/thanks');
  const id = `BAS-${randomBytes(4).toString('hex').toUpperCase()}`;
  const built = buildRecord(input, id);
  if (!built.ok) return bounce(`${from}?error=${built.error}`);
  let saved = false;
  try {
    await saveIntake(built.record);
    saved = true;
  } catch {
    saved = false;
  }
  if (built.record.type === 'alert') {
    try {
      if (await saveAlertSubscriptions(built.record.fields)) saved = true;
    } catch {
      /* The file copy can still stand if the key store is down. */
    }
    await tagAlert(built.record.fields);
  } else if (formspreeIntakeTypes.has(built.record.type)) {
    const emailed = await notifyFormspree({
      email: built.record.fields.email,
      subject: formspreeSubject(built.record.type, built.record.summary),
      fields: {
        type: built.record.type,
        id: built.record.id,
        summary: built.record.summary,
        total: built.record.total ? String(built.record.total) : '',
        ...built.record.fields,
      },
    });
    if (!emailed) return bounce(`${from}?error=save`);
    saved = true;
  }
  if (!saved) return bounce(`${from}?error=save`);
  if (built.record.type === 'alert') return bounce('/alerts?joined=1');
  return bounce(`/thanks?id=${built.record.id}&kind=${built.record.type}`);
};
