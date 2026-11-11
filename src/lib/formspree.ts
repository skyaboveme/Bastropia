import { formspreeEndpoint } from '../data/site';

/** Desk forms that are not Kit newsletter/alert signups. */
export const formspreeIntakeTypes = new Set(['ad', 'upgrade', 'event', 'business', 'tip']);

type FormspreePayload = {
  email: string;
  subject: string;
  fields: Record<string, string>;
};

/**
 * Email the desk through Formspree. Used from Worker API routes after local
 * validation — Astro forms keep posting to /api/intake and /api/tip.
 */
export async function notifyFormspree({ email, subject, fields }: FormspreePayload) {
  const body: Record<string, string> = {
    email,
    _replyto: email,
    _subject: subject.slice(0, 200),
  };
  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;
    if (key === 'email') continue;
    body[key] = value.slice(0, 4000);
  }

  try {
    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function formspreeSubject(type: string, summary: string) {
  const labels: Record<string, string> = {
    ad: 'Ad request',
    upgrade: 'Upgrade request',
    event: 'Event submission',
    business: 'Business listing',
    tip: 'Tip',
  };
  const label = labels[type] || 'Desk note';
  return `Bastropia ${label}: ${summary}`.slice(0, 180);
}
