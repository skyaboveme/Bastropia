import { TZ } from './time';

const headers = { 'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)', accept: 'text/html,application/json' };

export type MetricLine = {
  label: string;
  detail: string;
  href: string;
};

export type ParkStatus = {
  name: string;
  href: string;
  alertHref: string;
  label: string;
  detail: string;
};

export type MetricsExtra = {
  sunrise: MetricLine | null;
  sunset: MetricLine | null;
  lake: MetricLine | null;
  gas: MetricLine | null;
  diesel: MetricLine | null;
  redDye: MetricLine | null;
  aquaOutage: MetricLine | null;
  aquaDrought: MetricLine | null;
  parks: ParkStatus[];
  burnSeason: string | null;
  burnSignup: string | null;
};

let cache: { at: number; value: MetricsExtra } | null = null;
const tenMinutes = 10 * 60 * 1000;

async function getText(url: string, timeout = 7000) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(String(response.status));
  return response.text();
}

function plain(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;|&#038;/g, '&')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;|&#8212;|&mdash;/g, '–')
    .replace(/&#(\d+);/g, (_, code) => {
      const value = Number(code);
      return value === 10 || value === 13 ? ' ' : String.fromCharCode(value);
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function clock(iso: string) {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return iso;
  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelve = hour % 12 || 12;
  return `${twelve}:${minute} ${suffix}`;
}

function chicagoClock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

async function sun(): Promise<Pick<MetricsExtra, 'sunrise' | 'sunset'>> {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=30.1105&longitude=-97.3153&daily=sunrise,sunset&timezone=America/Chicago&forecast_days=1';
  const data = await getText(url).then((body) => JSON.parse(body));
  const rise = data?.daily?.sunrise?.[0];
  const set = data?.daily?.sunset?.[0];
  const href = 'https://open-meteo.com/';
  return {
    sunrise: typeof rise === 'string' ? { label: clock(rise), detail: 'Bastrop coordinates', href } : null,
    sunset: typeof set === 'string' ? { label: clock(set), detail: 'Bastrop coordinates', href } : null,
  };
}

async function lake(): Promise<MetricLine | null> {
  const data = await getText('https://hydromet.lcra.org/api/RiverReport/GetRiverReportData/').then((body) => JSON.parse(body));
  const row = (data?.currentLakeLevels ?? []).find((item: { site_name?: string }) => item.site_name === 'Bastrop');
  if (!row || row.head_Elevation == null) return null;
  const feet = Number(row.head_Elevation).toFixed(2);
  const week = row.wkElev == null ? '' : `A week ago ${Number(row.wkElev).toFixed(2)} ft.`;
  const month = row.monthElev == null ? '' : `A month ago ${Number(row.monthElev).toFixed(2)} ft.`;
  const when = chicagoClock(String(row.date_time ?? ''));
  return {
    label: `${feet} ft`,
    detail: [when ? `${when}.` : '', week, month].filter(Boolean).join(' '),
    href: 'https://hydromet.lcra.org/riverreport/',
  };
}

function eiaDate(value: string) {
  const [month, day, year] = value.split('/').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000 + year, month - 1, day)),
  );
}

function fuelLine(row: RegExpMatchArray, dates: string[], detail: string): MetricLine | null {
  if (dates.length < 3) return null;
  const latest = Number(row[3]);
  const weekChange = Number(row[6]);
  if (!Number.isFinite(latest) || !Number.isFinite(weekChange)) return null;
  const cents = Math.abs(weekChange * 100).toFixed(1).replace(/\.0$/, '');
  const direction = weekChange < 0 ? 'below' : weekChange > 0 ? 'above' : 'the same as';
  const change = weekChange === 0 ? 'Unchanged from the prior week.' : `${cents} cents ${direction} the ${eiaDate(dates[1])} price.`;
  return {
    label: `$${latest.toFixed(3)}`,
    detail: `${detail} Week of ${eiaDate(dates[2])}. ${change}`,
    href: 'https://www.eia.gov/petroleum/gasdiesel/',
  };
}

async function fuel(): Promise<{ regular: MetricLine | null; diesel: MetricLine | null }> {
  const html = await getText('https://www.eia.gov/petroleum/gasdiesel/');
  const text = plain(html);
  const gasStart = text.indexOf('U.S. Regular Gasoline Prices');
  const dieselStart = text.indexOf('U.S. On-Highway Diesel');
  if (gasStart < 0 || dieselStart < gasStart) return { regular: null, diesel: null };
  const gasSlice = text.slice(gasStart, dieselStart);
  const dieselSlice = text.slice(dieselStart, dieselStart + 2500);
  const dates = [...gasSlice.matchAll(/\d{2}\/\d{2}\/\d{2}/g)].map((match) => match[0]);
  const texas = gasSlice.match(/Texas\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/);
  const gulf = dieselSlice.match(/Gulf Coast \(PADD3\)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/);
  return {
    regular: texas ? fuelLine(texas, dates, 'Texas regular. Not a town price.') : null,
    diesel: gulf
      ? fuelLine(gulf, dates, 'On-highway diesel for the Gulf Coast, the EIA region that includes Texas. Not a town price, and not red dye.')
      : null,
  };
}

async function redDye(): Promise<MetricLine | null> {
  const href = 'https://www.eia.gov/tools/faqs/faq.php?id=14&t=9';
  const text = plain(await getText(href));
  if (!/do not publish prices specifically for off-road diesel/i.test(text)) return null;
  return {
    label: 'Not posted',
    detail: 'EIA does not publish a red-dye, off-road diesel price.',
    href,
  };
}

async function aquaOutage(): Promise<MetricLine | null> {
  const href = 'https://www.aquawsc.com/service-interruptions/';
  const text = plain(await getText(href));
  const marker = text.search(/find your Zone\.?/i);
  if (marker < 0) return null;
  let listed = text.slice(marker).replace(/^find your Zone\.?\s*/i, '');
  const stop = listed.search(/Report a Water Leak/i);
  if (stop >= 0) listed = listed.slice(0, stop);
  listed = listed.replace(/\s+/g, ' ').trim();
  if (!listed || /no (active|current) (service )?interrupt/i.test(listed)) {
    return { label: 'None listed', detail: 'Aqua’s interruptions page has no zone on it.', href };
  }
  return { label: 'Listed', detail: listed, href };
}

async function aquaDrought(): Promise<MetricLine | null> {
  const href = 'https://www.aquawsc.com/conservation-environment/water-conservation/water-restrictions/';
  const text = plain(await getText(href));
  const sentence = text.match(/Effective [^.]+\./);
  if (/no longer under any drought restrictions/i.test(text)) {
    return {
      label: 'None',
      detail: sentence?.[0] ?? 'Aqua says drought restrictions are no longer in effect.',
      href,
    };
  }
  const stage = text.match(/Stage\s+\d+/i);
  if (!stage) return null;
  return { label: stage[0], detail: sentence?.[0] ?? 'Posted on Aqua’s drought page.', href };
}

function parkAlerts(html: string) {
  const text = plain(html);
  return [...text.matchAll(
    /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})\s+-\s+([\s\S]+?)(?=Check (?:here|back)\b|$)/gi,
  )]
    .map((match) => {
      const body = match[2].replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '');
      return `${match[1]} — ${body}.`;
    })
    .filter((line) => line.length > 24);
}

function parkTone(detail: string) {
  return /clos(?:ed|ure|ing)|prescribed burn|evacuat/i.test(detail) ? 'Alert' : 'Notice';
}

async function park(name: string, slug: string): Promise<ParkStatus> {
  const href = `https://tpwd.texas.gov/state-parks/${slug}`;
  const alertHref = `${href}/alert`;
  try {
    const notices = parkAlerts(await getText(alertHref));
    if (!notices.length) {
      return { name, href, alertHref, label: 'None listed', detail: 'The alert page has no dated notice.' };
    }
    const detail = notices.join(' ');
    return { name, href, alertHref, label: parkTone(detail), detail };
  } catch {
    return { name, href, alertHref, label: 'Not loaded', detail: 'The alert page did not load.' };
  }
}

async function forestNotes(): Promise<{ season: string | null; signup: string | null }> {
  const text = plain(await getText('https://tpwd.texas.gov/state-parks/bastrop/protecting-forest'));
  const match = text.match(/conduct burns [^.]+\./i);
  return {
    season: match ? match[0] : null,
    signup: /texting BastropRX to 888777/i.test(text)
      ? 'Text BastropRX to 888777 for prescribed-burn alerts at these two parks.'
      : null,
  };
}

export async function getMetricsExtra(): Promise<MetricsExtra> {
  if (cache && Date.now() - cache.at < tenMinutes) return cache.value;
  const [sunResult, lakeResult, fuelResult, dyeResult, outageResult, droughtResult, bastrop, buescher, forest] = await Promise.all([
    sun().catch(() => ({ sunrise: null, sunset: null })),
    lake().catch(() => null),
    fuel().catch(() => ({ regular: null, diesel: null })),
    redDye().catch(() => null),
    aquaOutage().catch(() => null),
    aquaDrought().catch(() => null),
    park('Bastrop State Park', 'bastrop'),
    park('Buescher State Park', 'buescher'),
    forestNotes().catch(() => ({ season: null, signup: null })),
  ]);
  const value: MetricsExtra = {
    sunrise: sunResult.sunrise,
    sunset: sunResult.sunset,
    lake: lakeResult,
    gas: fuelResult.regular,
    diesel: fuelResult.diesel,
    redDye: dyeResult,
    aquaOutage: outageResult,
    aquaDrought: droughtResult,
    parks: [bastrop, buescher],
    burnSeason: forest.season,
    burnSignup: forest.signup,
  };
  cache = { at: Date.now(), value };
  return value;
}

export function flowLabel(detail: string) {
  const match = detail.match(/([\d,]+)\s*cfs/i);
  return match ? `${match[1]} cfs` : null;
}
