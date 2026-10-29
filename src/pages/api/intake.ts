import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { buildRecord, saveIntake } from '../../lib/intake';

export const prerender = false;

function bounce(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

const origins = new Set(['/', '/advertise', '/upgrade', '/submit']);

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
  try {
    await saveIntake(built.record);
  } catch {
    return bounce(`${from}?error=save`);
  }
  return bounce(`/thanks?id=${built.record.id}`);
};
