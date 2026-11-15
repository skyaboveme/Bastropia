import { formspreeEndpoint, siteUrl } from '../data/site';

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
    if (key === 'email' || key === 'from' || key === 'bastro_hp' || key === 'company_website') continue;
    body[key] = value.slice(0, 4000);
  }
  if (!body.message && body.summary) body.message = body.summary;

  try {
    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: siteUrl,
        Referer: `${siteUrl}/`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('formspree', response.status, detail.slice(0, 300));
      return false;
    }
    return true;
  } catch (error) {
    console.error('formspree', error);
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
