import { eventKey } from './time';

const headers = { 'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)', accept: 'text/html,application/json' };

export type SchoolState = 'closed' | 'delayed' | 'normal' | 'unknown';

export type SchoolDay = {
  name: string;
  short: string;
  href: string;
  status: SchoolState;
  label: string;
  note: string;
};

const districts: { name: string; short: string; href: string }[] = [
  { name: 'Bastrop ISD', short: 'Bastrop', href: 'https://www.bisdtx.org/' },
  { name: 'Elgin ISD', short: 'Elgin', href: 'https://www.elginisd.net/' },
  { name: 'Smithville ISD', short: 'Smithville', href: 'https://www.smithvilleisd.org/' },
  { name: 'McDade ISD', short: 'McDade', href: 'https://www.mcdadeisd.com/' },
];

const labels: Record<SchoolState, string> = {
  closed: 'Closed',
  delayed: 'Delayed',
  normal: 'Normal day',
  unknown: 'Not posted',
};

/** A Finalsite calendar id uses midnight Central (05:00 or 06:00 UTC) as the date. */
export function schoolNotesFromHtml(html: string, today: string) {
  const notes: { status: 'closed' | 'delayed'; note: string }[] = [];
  const pattern =
    /(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}Z_(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}Z[\s\S]{0,800}?fsTitle[^>]*>([^<]+)/gi;
  for (const match of html.matchAll(pattern)) {
    const start = match[1];
    const end = match[2];
    const title = match[3].replace(/\s+/g, ' ').trim();
    if (!title || today < start || today >= end) continue;
    if (/closed|no school|holiday/i.test(title)) notes.push({ status: 'closed', note: title });
    else if (/delay|late start|early release|early dismissal/i.test(title)) notes.push({ status: 'delayed', note: title });
  }
  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  if (/schools? (are|will be) closed today|closed for students today/i.test(plain) && !notes.some((item) => item.status === 'closed')) {
    notes.push({ status: 'closed', note: 'The district page says schools are closed today.' });
  }
  if (/\b(2-hour delay|two-hour delay|delayed opening) today\b/i.test(plain) && !notes.some((item) => item.status === 'delayed')) {
    notes.push({ status: 'delayed', note: 'The district page says a delay today.' });
  }
  return notes;
}

function dayFromNotes(district: (typeof districts)[number], notes: { status: 'closed' | 'delayed'; note: string }[]): SchoolDay {
  const closed = notes.filter((item) => item.status === 'closed');
  const delayed = notes.filter((item) => item.status === 'delayed');
  const hit = closed[0] ?? delayed[0];
  const status: SchoolState = hit?.status ?? 'normal';
  return {
    ...district,
    status,
    label: labels[status],
    note: hit?.note ?? 'No closing or delay is posted on the district homepage.',
  };
}

export async function getSchoolDays(now = new Date()): Promise<SchoolDay[]> {
  const today = eventKey(now);
  return Promise.all(
    districts.map(async (district) => {
      try {
        const response = await fetch(district.href, { headers, signal: AbortSignal.timeout(6000) });
        if (!response.ok) throw new Error(String(response.status));
        const html = await response.text();
        return dayFromNotes(district, schoolNotesFromHtml(html, today));
      } catch {
        return { ...district, status: 'unknown' as const, label: labels.unknown, note: 'The district homepage did not load.' };
      }
    }),
  );
}

export function schoolSummary(days: SchoolDay[]) {
  const closed = days.filter((day) => day.status === 'closed');
  const delayed = days.filter((day) => day.status === 'delayed');
  const picked = closed.length ? closed : delayed;
  if (!picked.length) {
    const quiet = days.every((day) => day.status === 'normal');
    return {
      label: quiet ? 'Normal day' : 'Check districts',
      detail: quiet ? '4 districts' : 'Homepage did not load',
      href: '/schools',
    };
  }
  const label = closed.length ? (closed.length > 1 ? `${closed.length} closed` : 'Closed') : delayed.length > 1 ? `${delayed.length} delayed` : 'Delayed';
  return { label, detail: picked.map((day) => day.short).join(', '), href: '/schools' };
}

export async function getPower() {
  const root = 'https://outage.bluebonnetelectric.coop';
  const href = 'https://www.bluebonnet.coop/outages';
  const [summaryResponse, listResponse] = await Promise.all([
    fetch(`${root}/data/outageSummary.json`, { headers, signal: AbortSignal.timeout(6000) }),
    fetch(`${root}/data/outages.json`, { headers, signal: AbortSignal.timeout(6000) }),
  ]);
  if (!summaryResponse.ok || !listResponse.ok) throw new Error('power');
  const summary = (await summaryResponse.json()) as { customersOutNow?: number };
  const list = (await listResponse.json()) as unknown[];
  const outages = Array.isArray(list) ? list.length : 0;
  const customers = Number(summary.customersOutNow) || 0;
  if (outages === 0 && customers === 0) return { label: 'None reported', detail: 'Bluebonnet', href };
  if (outages > 0) return { label: outages === 1 ? '1 outage' : `${outages} outages`, detail: 'Bluebonnet', href };
  return { label: customers === 1 ? '1 customer' : `${customers} customers`, detail: 'Bluebonnet', href };
}
