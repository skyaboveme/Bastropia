import { getPower, getSchoolDays, schoolSummary } from './interruptions';
import { TZ } from './time';

const headers = { 'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)', accept: 'application/json' };

/** TxDOT numbers counties alphabetically. 011 is Bastrop. */
const bastropCountyNumber = 11;
const watchRoutes = [
  { code: 'SH0071', name: 'SH 71' },
  { code: 'US0290', name: 'US 290' },
];

export type RoadKind = 'crash' | 'closure' | 'work';

export type RoadAlert = {
  route: string;
  delay: boolean;
  kind: RoadKind;
  from: string;
  to: string;
  detail: string;
};

export type StatusLine = { label: string; detail: string; href: string };

export type BeefQuote = StatusLine & { note: string };

export type CountyNow = {
  river: { label: string; detail: string; href: string } | null;
  air: { label: string; detail: string; href: string } | null;
  roads: { route: string; label: string; detail: string }[];
  others: RoadAlert[];
  closures: RoadAlert[];
  closureLine: StatusLine;
  schools: StatusLine | null;
  power: StatusLine | null;
  rain: StatusLine | null;
  beef: BeefQuote | null;
};

const cache: { at: number; value: CountyNow } | null = { at: 0, value: emptyNow() };
const tenMinutes = 10 * 60 * 1000;

function emptyNow(): CountyNow {
  return {
    river: null,
    air: null,
    roads: watchRoutes.map((route) => ({ route: route.name, label: '—', detail: '' })),
    others: [],
    closures: [],
    closureLine: { label: '—', detail: 'DriveTexas', href: '/roads' },
    schools: null,
    power: null,
    rain: null,
    beef: null,
  };
}

export function roadKind(detail: string): RoadKind {
  if (/\b(crash|accident|wreck|collision|stalled vehicle)\b/i.test(detail)) return 'crash';
  if (/\b(road closed|highway closed|closed to (all )?traffic|all lanes closed|impassable|bridge closed|full closure)\b/i.test(detail)) return 'closure';
  return 'work';
}

export function closureLine(alerts: RoadAlert[]): StatusLine {
  const stops = alerts.filter((alert) => alert.kind === 'crash' || alert.kind === 'closure');
  if (!stops.length) return { label: 'None reported', detail: 'DriveTexas', href: '/roads' };
  const crashes = stops.filter((alert) => alert.kind === 'crash');
  const label =
    crashes.length === stops.length
      ? crashes.length === 1
        ? 'Crash'
        : `${crashes.length} crashes`
      : stops.length === 1
        ? 'Closed'
        : `${stops.length} closed`;
  return {
    label,
    detail: [...new Set(stops.map((alert) => alert.route))].slice(0, 3).join(', '),
    href: '/roads',
  };
}

export function aqiWord(index: number) {
  if (index <= 50) return 'Good';
  if (index <= 100) return 'Moderate';
  if (index <= 150) return 'Unhealthy for sensitive groups';
  if (index <= 200) return 'Unhealthy';
  if (index <= 300) return 'Very unhealthy';
  return 'Hazardous';
}

export function routeName(code: string) {
  const match = code.match(/^([A-Z]+)0*(\d+)([A-Z])?$/);
  if (!match) return code;
  const kind = match[1] === 'IH' ? 'I' : match[1];
  return `${kind} ${match[2]}${match[3] ? match[3] : ''}`;
}

function plainAlert(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–]+/, '')
    .trim();
}

async function getJson(url: string, timeout = 5000) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

async function river(): Promise<CountyNow['river']> {
  const url =
    'https://api.waterdata.usgs.gov/ogcapi/v1/collections/latest-continuous/items?f=json&limit=10&monitoring_location_id=USGS-08159200';
  const data = await getJson(url);
  const features = data?.features ?? [];
  let feet: string | null = null;
  let flow: string | null = null;
  let when: string | null = null;
  let provisional = false;
  for (const feature of features) {
    const reading = feature?.properties ?? {};
    const code = String(reading.parameter_code ?? '');
    if (reading.value == null || reading.value === '') continue;
    if (code === '00065') feet = String(reading.value);
    if (code === '00060') flow = String(reading.value);
    if (code !== '00065' && code !== '00060') continue;
    when = reading.time ?? when;
    if (String(reading.approval_status ?? '').toLowerCase() === 'provisional') provisional = true;
  }
  if (!feet) return null;
  const clock = when
    ? new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(when))
    : '';
  return {
    label: `${Number(feet).toFixed(2)} ft`,
    detail: [flow ? `${Number(flow).toLocaleString('en-US')} cfs` : '', clock, provisional ? 'provisional' : '']
      .filter(Boolean)
      .join(' · '),
    href: 'https://waterdata.usgs.gov/monitoring-location/08159200/',
  };
}

async function air(): Promise<CountyNow['air']> {
  const url =
    'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=30.1105&longitude=-97.3153&current=us_aqi&timezone=America%2FChicago';
  const data = await getJson(url);
  const index = data?.current?.us_aqi;
  if (typeof index !== 'number') return null;
  return {
    label: String(Math.round(index)),
    detail: `${aqiWord(index)} · model`,
    href: 'https://www.tceq.texas.gov/cgi-bin/compliance/monops/daily_summary.pl?cams=1612',
  };
}

function rainLabel(inches: number) {
  if (!Number.isFinite(inches) || inches < 0.005) return '0 in';
  return `${inches.toFixed(2)} in`;
}

/** Model rainfall at the Bastrop coordinates, today and the six days before. */
async function recentRain(): Promise<CountyNow['rain']> {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=30.1105&longitude=-97.3153&daily=precipitation_sum&timezone=America/Chicago&past_days=6&forecast_days=1&precipitation_unit=inch';
  const data = await getJson(url);
  const days = data?.daily?.precipitation_sum;
  if (!Array.isArray(days) || days.length < 7) return null;
  const inches = days.slice(-7).reduce((sum: number, value: unknown) => sum + (Number(value) || 0), 0);
  return {
    label: rainLabel(inches),
    detail: 'Last 7 days',
    href: '/weather',
  };
}

const beefReportUrl = 'https://www.ams.usda.gov/mnreports/ams_1955.pdf';

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, from: number) {
  outer: for (let i = from; i <= haystack.length - needle.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function latin1(bytes: Uint8Array) {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return text;
}

async function inflateZlib(bytes: Uint8Array) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Pull the text runs out of a USDA market PDF. */
export async function pdfTextRuns(bytes: Uint8Array) {
  const streamMark = new TextEncoder().encode('stream');
  const endMark = new TextEncoder().encode('endstream');
  const runs: string[] = [];
  let cursor = 0;
  while (cursor < bytes.length) {
    const at = indexOfBytes(bytes, streamMark, cursor);
    if (at < 0) break;
    let start = at + streamMark.length;
    if (bytes[start] === 13) start += 1;
    if (bytes[start] === 10) start += 1;
    const stop = indexOfBytes(bytes, endMark, start);
    if (stop < 0) break;
    let finish = stop;
    if (finish > start && bytes[finish - 1] === 10) finish -= 1;
    if (finish > start && bytes[finish - 1] === 13) finish -= 1;
    cursor = stop + endMark.length;
    try {
      const inflated = await inflateZlib(bytes.slice(start, finish));
      const text = latin1(inflated);
      const pattern = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
      for (const match of text.matchAll(pattern)) {
        runs.push(
          match[1]
            .replace(/\\([()\\])/g, '$1')
            .replace(/\\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        );
      }
    } catch {
      // Image streams and other filters are not the price table.
    }
  }
  return runs;
}

function isCount(value: string) {
  return /^\d+$/.test(value);
}

function isWeight(value: string) {
  return /^\d+(?:-\d+)?$/.test(value);
}

function isMoney(value: string) {
  return /^\d+\.\d{2}(?:-\d+\.\d{2})?$/.test(value);
}

function weekPhrase(tokens: string[]) {
  const line = tokens.find((token) => token.includes('Weighted Average Report for'));
  const match = line?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return '';
  const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  const startMonth = Number(match[1]) - 1;
  const endMonth = Number(match[4]) - 1;
  const start = `${months[startMonth]} ${Number(match[2])}`;
  const end = startMonth === endMonth ? String(Number(match[5])) : `${months[endMonth]} ${Number(match[5])}`;
  return `Week of ${start}–${end}`;
}

type SteerRow = { head: number; range: string; price: string; note: string };

function steerRows(tokens: string[]) {
  const start = tokens.findIndex((token) => token.startsWith('STEERS - Medium and Large 1 (Per Cwt'));
  if (start < 0) return [];
  const rows: SteerRow[] = [];
  for (let i = start + 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (/^(HEIFERS|BULLS|SLAUGHTER|STEERS -|COWS|LIVESTOCK)/.test(token)) break;
    const weight = tokens[i + 1];
    const averageWeight = tokens[i + 2];
    const priceRange = tokens[i + 3];
    const average = tokens[i + 4];
    if (!isCount(token) || !isWeight(weight) || !isCount(averageWeight) || !isMoney(priceRange) || !isMoney(average) || average.includes('-')) {
      continue;
    }
    const following = tokens[i + 5] ?? '';
    const note = following && !isCount(following) && !following.includes('(') && !following.endsWith(':') ? following : '';
    rows.push({ head: Number(token), range: weight, price: average, note });
    i += note ? 5 : 4;
  }
  return rows;
}

function weightPhrase(range: string) {
  return `${range.replace('-', '–')} lb`;
}

/** The plain 500 lb steer class from the Texas weekly auction summary. */
export function beefFromTokens(tokens: string[]): BeefQuote | null {
  const rows = steerRows(tokens).filter((row) => !row.note);
  if (!rows.length) return null;
  const fiveHundreds = rows.filter((row) => {
    const [low, high] = row.range.split('-').map(Number);
    return low <= 599 && (high || low) >= 500;
  });
  const picked = (fiveHundreds.length ? fiveHundreds : rows).sort((a, b) => b.head - a.head)[0];
  const week = weekPhrase(tokens);
  return {
    label: `$${picked.price}`,
    detail: 'Feeder steers',
    note: `${week ? `${week}. ` : ''}Medium and large 1 steers, ${weightPhrase(picked.range)}, ${picked.head.toLocaleString('en-US')} head. Average price per hundredweight from the USDA Texas auction summary.`,
    href: beefReportUrl,
  };
}

async function beef(): Promise<BeefQuote | null> {
  const response = await fetch(beefReportUrl, { headers, signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 1000 || bytes[0] !== 0x25) return null;
  return beefFromTokens(await pdfTextRuns(bytes));
}

async function roads(): Promise<{ watched: CountyNow['roads']; alerts: RoadAlert[] }> {
  const request = {
    action: 'table/query',
    query: {
      table: 'appgeo/conditionsLine',
      sqlselect: ['RTENM', 'CNSTRNTDELAYFLAG', 'CONDLMTFROMDSCR', 'CONDLMTTODSCR', 'CONDDSCR'],
      start: 0,
      take: 40,
      where: [{ col: 'TXDOTCOUNTYNBR', test: 'Equal', value: bastropCountyNumber }],
    },
  };
  const url = `https://dtx-e-cdn.maplarge.com/Api/ProcessDirect?request=${encodeURIComponent(JSON.stringify(request))}`;
  const data = await getJson(url, 7000);
  const rows = data?.data?.data ?? {};
  const count = rows.RTENM?.length ?? 0;
  const alerts: RoadAlert[] = [];
  for (let index = 0; index < count; index += 1) {
    const detail = plainAlert(String(rows.CONDDSCR?.[index] ?? ''));
    alerts.push({
      route: routeName(String(rows.RTENM[index] ?? '')),
      delay: rows.CNSTRNTDELAYFLAG?.[index] === 'Y',
      kind: roadKind(detail),
      from: String(rows.CONDLMTFROMDSCR?.[index] ?? ''),
      to: String(rows.CONDLMTTODSCR?.[index] ?? ''),
      detail,
    });
  }
  const watched = watchRoutes.map((route) => {
    const hit = alerts.find((alert) => alert.route === route.name && alert.kind === 'work');
    return hit
      ? { route: route.name, label: hit.delay ? 'Delays' : 'Alert', detail: hit.detail }
      : { route: route.name, label: 'None listed', detail: 'DriveTexas' };
  });
  return { watched, alerts };
}

export async function getCountyNow(): Promise<CountyNow> {
  if (cache && Date.now() - cache.at < tenMinutes) return cache.value;
  const [riverResult, airResult, roadResult, schoolDays, powerResult, rainResult, beefResult] = await Promise.all([
    river().catch(() => null),
    air().catch(() => null),
    roads().catch(() => null),
    getSchoolDays().catch(() => null),
    getPower().catch(() => null),
    recentRain().catch(() => null),
    beef().catch(() => null),
  ]);
  const alerts = roadResult?.alerts ?? [];
  const closures = alerts.filter((alert) => alert.kind === 'crash' || alert.kind === 'closure');
  const value: CountyNow = {
    river: riverResult,
    air: airResult,
    roads: roadResult?.watched ?? emptyNow().roads,
    others: alerts.filter((alert) => alert.kind === 'work' && !watchRoutes.some((route) => route.name === alert.route)),
    closures,
    closureLine: closureLine(alerts),
    schools: schoolDays ? schoolSummary(schoolDays) : null,
    power: powerResult,
    rain: rainResult,
    beef: beefResult,
  };
  // A missed gauge should be tried again soon. A full reading can sit for ten minutes.
  cache.at = value.river ? Date.now() : Date.now() - tenMinutes + 30_000;
  cache.value = value;
  return value;
}
