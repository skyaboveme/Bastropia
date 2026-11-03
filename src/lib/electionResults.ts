import { electionDay, electionHours } from '../data/vote';
import { chicagoParts, labelFromKey } from './time';

const headers = { 'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)', accept: 'application/json,text/plain' };
const listUrl = 'https://results.enr.clarityelections.com/TX/Bastrop/elections.json';

export const resultsHome = 'https://www.bastropvotes.org/election-results-2/';
export const resultsEnr = 'https://results.enr.clarityelections.com/TX/Bastrop/';
/** November 3, 2026 county summary. The live loader replaces this when the office publishes a new page. */
export const resultsSummary = 'https://results.enr.clarityelections.com/TX/Bastrop/127476/web.345435/#/summary';
export const resultsOffice = {
  name: 'Bastrop County Elections',
  phone: '512-581-7160',
  email: 'elections@co.bastrop.tx.us',
};

export type ResultChoice = {
  name: string;
  party: string;
  votes: number;
  percent: number;
};

export type ResultRace = {
  category: string;
  name: string;
  votes: number;
  precinctsReporting: number;
  precincts: number;
  choices: ResultChoice[];
};

export type VoteCenterStatus = 'reported' | 'partial' | 'not-reported' | 'out' | 'other';

export type VoteCenterPoint = {
  name: string;
  address: string;
  status: VoteCenterStatus;
  label: string;
  x: number;
  y: number;
};

export type CenterMap = {
  width: number;
  height: number;
  paths: string[];
  centers: VoteCenterPoint[];
  reported: number;
  partial: number;
  waiting: number;
};

export type ElectionBoard = {
  title: string;
  electionId: string;
  updated: string;
  reporting: number;
  precincts: number;
  votesReported: boolean;
  status: string;
  sourceUrl: string;
  summaryUrl: string;
  registeredVoters: number;
  ballotsCast: number;
  races: ResultRace[];
  centerMap: CenterMap | null;
};

type ClarityElection = { EID: string; ElectionName: string; Date: string };
type ClarityRow = {
  CAT?: string;
  C?: string;
  CH?: string[];
  P?: string[];
  V?: number[];
  PCT?: number[];
  PR?: number;
  TP?: number;
  TV?: number;
};

const cache = new Map<string, { at: number; value: ElectionBoard | null }>();

const categoryOrder = [
  'Federal',
  'State',
  'County',
  'Bastrop ISD',
  'McDade ISD',
  'ACC',
  'ESD#2',
  'City of Bastrop Special Election',
  'City of Smithville Special Election',
  'City of Elgin Special Election',
];

function choiceName(raw: string, party: string) {
  const prefix = party ? `${party} ` : '';
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}

function electionDateKey(value: string) {
  const [date] = value.split(' ');
  const [month, day, year] = date.split('/');
  if (!year || !month || !day) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

type RawCenter = { voteCenter?: { idVoteCenter?: string; voteCenterName?: string; address?: string; latitude?: string; longitude?: string } };
type RawOutline = { GCords?: string };

const centerStatus: Record<number, { status: VoteCenterStatus; label: string }> = {
  0: { status: 'reported', label: 'Certified' },
  1: { status: 'not-reported', label: 'Not reported' },
  2: { status: 'partial', label: 'Partially reported' },
  4: { status: 'reported', label: 'Completely reported' },
  8: { status: 'out', label: 'Not participating' },
  64: { status: 'reported', label: 'Election night complete' },
};

function decodePath(encoded: string) {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encoded.length);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encoded.length);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function thin(points: [number, number][], max = 48) {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  const kept = points.filter((_, index) => index % step === 0);
  const last = points[points.length - 1];
  if (kept[kept.length - 1] !== last) kept.push(last);
  return kept;
}

function centerMapFor(centers: RawCenter[], status: { P?: string[]; S?: number[] }, outlines: RawOutline[]): CenterMap | null {
  const byId = new Map((status.P ?? []).map((id, index) => [id, status.S?.[index] ?? 1]));
  const places = centers.flatMap((row) => {
    const center = row.voteCenter;
    const lat = Number(center?.latitude);
    const lng = Number(center?.longitude);
    if (!center?.voteCenterName || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const code = byId.get(center.idVoteCenter ?? '') ?? 1;
    const named = centerStatus[code] ?? { status: 'other' as const, label: 'Not reported' };
    return [{
      name: center.voteCenterName.replace(/,\s*$/, ''),
      address: (center.address ?? '').replace(/,?\s*USA$/, ''),
      lat,
      lng,
      status: named.status,
      label: named.label,
    }];
  });
  if (!places.length) return null;
  const rings = outlines.flatMap((outline) => {
    const ring = outline.GCords ? thin(decodePath(outline.GCords)) : [];
    return ring.length > 2 ? [ring] : [];
  });
  const points = rings.flat().concat(places.map((place) => [place.lat, place.lng] as [number, number]));
  const lats = points.map((point) => point[0]);
  const lngs = points.map((point) => point[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const width = 640;
  const height = 520;
  const pad = 28;
  const project = (lat: number, lng: number) => {
    const x = pad + ((lng - minLng) / (maxLng - minLng || 1)) * (width - pad * 2);
    const y = pad + ((maxLat - lat) / (maxLat - minLat || 1)) * (height - pad * 2);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  };
  const paths = rings.map((ring) => ring.map(([lat, lng]) => {
    const [x, y] = project(lat, lng);
    return `${x},${y}`;
  }).join(' '));
  const mapped = places
    .map((place) => {
      const [x, y] = project(place.lat, place.lng);
      return { name: place.name, address: place.address, status: place.status, label: place.label, x, y };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    width,
    height,
    paths,
    centers: mapped,
    reported: mapped.filter((place) => place.status === 'reported').length,
    partial: mapped.filter((place) => place.status === 'partial').length,
    waiting: mapped.filter((place) => place.status === 'not-reported').length,
  };
}

function statusLine(now: Date, votesReported: boolean) {
  const { key, hour } = chicagoParts(now);
  const day = labelFromKey(electionDay);
  if (votesReported) return 'Unofficial totals from the county election-night report. The county certifies them later.';
  if (key < electionDay) return `Polls are open ${electionHours} on ${day}. The elections office has not reported votes.`;
  if (key === electionDay && hour < 19) return `Polls are open until 7 pm. The elections office has not reported votes.`;
  return 'The elections office has not posted the first results.';
}

async function load(url: string) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(String(response.status));
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('json')) return response.json();
  const text = await response.text();
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
  return text;
}

export async function getElectionBoard(now = new Date()): Promise<ElectionBoard | null> {
  const hit = cache.get('board');
  const freshFor = 60 * 1000;
  if (hit && Date.now() - hit.at < freshFor) return hit.value;
  try {
    const elections = (await load(listUrl)) as ClarityElection[];
    const current =
      elections.find((election) => electionDateKey(election.Date) === electionDay) ??
      elections[0];
    if (!current) throw new Error('no election');
    const version = String(await load(`https://results.enr.clarityelections.com/TX/Bastrop/${current.EID}/current_ver.txt`)).trim();
    const root = `https://results.enr.clarityelections.com/TX/Bastrop/${current.EID}/${version}/json`;
    const [summary, settings, shell, centers, centerStatusFile] = (await Promise.all([
      load(`${root}/en/summary.json`),
      load(`${root}/en/electionsettings.json`),
      load(`https://results.enr.clarityelections.com/TX/Bastrop/${current.EID}/`).catch(() => ''),
      load(`${root}/vc.json`).catch(() => []),
      load(`${root}/vc_status.json`).catch(() => ({})),
    ])) as [
      ClarityRow[],
      {
        websiteupdatedat?: string;
        settings?: {
          numberofprecinctsreporting?: number;
          totalprecinctsreporting?: number;
          electiondetails?: { registeredvoters?: number | string; ballotscast?: number | string };
          kmlmap?: string;
        };
      },
      string,
      RawCenter[],
      { P?: string[]; S?: number[] },
    ];
    const webVersion = String(shell).match(/web\.(\d+)/)?.[1];
    const summaryUrl = webVersion
      ? `https://results.enr.clarityelections.com/TX/Bastrop/${current.EID}/web.${webVersion}/#/summary`
      : current.EID === '127476'
        ? resultsSummary
        : `https://results.enr.clarityelections.com/TX/Bastrop/${current.EID}/`;
    const details = settings.settings?.electiondetails;
    const mapName = settings.settings?.kmlmap;
    const outlines = mapName
      ? ((await load(`${root}/${mapName}`).catch(() => [])) as RawOutline[])
      : [];
    const centerMap = centerMapFor(
      Array.isArray(centers) ? centers : [],
      centerStatusFile ?? {},
      Array.isArray(outlines) ? outlines : [],
    );
    const races = summary
      .filter((row) => row.C && row.CH?.length)
      .map((row) => {
        const choices = (row.CH ?? []).map((name, index) => ({
          name: choiceName(name, row.P?.[index] ?? ''),
          party: row.P?.[index] ?? '',
          votes: row.V?.[index] ?? 0,
          percent: row.PCT?.[index] ?? 0,
        }));
        const votes = row.TV ?? choices.reduce((sum, choice) => sum + choice.votes, 0);
        if (votes > 0) choices.sort((a, b) => b.votes - a.votes);
        return {
          category: row.CAT ?? 'Other',
          name: row.C ?? '',
          votes,
          precinctsReporting: row.PR ?? 0,
          precincts: row.TP ?? 0,
          choices,
        };
      });
    const votesReported = races.some((race) => race.votes > 0);
    const precincts = settings.settings?.totalprecinctsreporting || Math.max(0, ...races.map((race) => race.precincts));
    const board: ElectionBoard = {
      title: `${current.ElectionName} · ${labelFromKey(electionDateKey(current.Date))}`,
      electionId: current.EID,
      updated: settings.websiteupdatedat ?? '',
      reporting: settings.settings?.numberofprecinctsreporting ?? 0,
      precincts,
      votesReported,
      status: statusLine(now, votesReported),
      sourceUrl: `https://results.enr.clarityelections.com/TX/Bastrop/${current.EID}/`,
      summaryUrl,
      registeredVoters: Number(details?.registeredvoters) || 0,
      ballotsCast: Number(details?.ballotscast) || 0,
      races,
      centerMap,
    };
    cache.set('board', { at: Date.now(), value: board });
    return board;
  } catch (error) {
    console.error('Election results failed', error instanceof Error ? error.message : error);
    if (hit?.value) return hit.value;
    cache.set('board', { at: Date.now() - freshFor + 30_000, value: null });
    return null;
  }
}

/** These county contests lead the Bastrop County group, in this order. */
const countyLead = [
  'County Commissioner Pct 4',
  'JOP Pct 2',
  'JOP Pct 1',
  'County Judge',
];

function withCountyLead(races: ResultRace[]) {
  const lead: ResultRace[] = [];
  const used = new Set<ResultRace>();
  for (const name of countyLead) {
    const race = races.find((item) => item.category === 'County' && item.name === name);
    if (!race) continue;
    lead.push(race);
    used.add(race);
  }
  return [...lead, ...races.filter((race) => !used.has(race))];
}

export function racesByCategory(races: ResultRace[], firstCategory?: string) {
  const groups = new Map<string, ResultRace[]>();
  for (const race of withCountyLead(races)) {
    const list = groups.get(race.category) ?? [];
    list.push(race);
    groups.set(race.category, list);
  }
  const known = categoryOrder.filter((name) => groups.has(name));
  const rest = [...groups.keys()].filter((name) => !categoryOrder.includes(name));
  const names = [...known, ...rest];
  if (firstCategory) {
    const index = names.indexOf(firstCategory);
    if (index > 0) names.unshift(...names.splice(index, 1));
  }
  return names.map((name) => ({ name, races: groups.get(name) ?? [] }));
}
