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

export type CountyNow = {
  river: { label: string; detail: string; href: string } | null;
  air: { label: string; detail: string; href: string } | null;
  roads: { route: string; label: string; detail: string }[];
  others: RoadAlert[];
  closures: RoadAlert[];
  closureLine: StatusLine;
  schools: StatusLine | null;
  power: StatusLine | null;
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
    'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=08159200&parameterCd=00065,00060&siteStatus=all';
  const data = await getJson(url);
  const series = data?.value?.timeSeries ?? [];
  let feet: string | null = null;
  let flow: string | null = null;
  let when: string | null = null;
  let provisional = false;
  for (const row of series) {
    const name = String(row?.variable?.variableName ?? '');
    const latest = row?.values?.[0]?.value?.at(-1);
    if (!latest) continue;
    if (name.startsWith('Gage height')) feet = latest.value;
    if (name.startsWith('Streamflow')) flow = latest.value;
    when = latest.dateTime ?? when;
    if ((latest.qualifiers ?? []).includes('P')) provisional = true;
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
  const [riverResult, airResult, roadResult, schoolDays, powerResult] = await Promise.all([
    river().catch(() => null),
    air().catch(() => null),
    roads().catch(() => null),
    getSchoolDays().catch(() => null),
    getPower().catch(() => null),
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
  };
  cache.at = Date.now();
  cache.value = value;
  return value;
}
