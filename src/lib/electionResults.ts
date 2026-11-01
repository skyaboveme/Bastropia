import { electionDay, electionHours } from '../data/vote';
import { chicagoParts, labelFromKey } from './time';

const headers = { 'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)', accept: 'application/json,text/plain' };
const listUrl = 'https://results.enr.clarityelections.com/TX/Bastrop/elections.json';

export const resultsHome = 'https://www.bastropvotes.org/election-results-2/';
export const resultsEnr = 'https://results.enr.clarityelections.com/TX/Bastrop/';
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

export type ElectionBoard = {
  title: string;
  electionId: string;
  updated: string;
  reporting: number;
  precincts: number;
  votesReported: boolean;
  status: string;
  sourceUrl: string;
  races: ResultRace[];
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
  return type.includes('json') ? response.json() : response.text();
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
    const [summary, settings] = (await Promise.all([
      load(`${root}/en/summary.json`),
      load(`${root}/en/electionsettings.json`),
    ])) as [ClarityRow[], { websiteupdatedat?: string; settings?: { numberofprecinctsreporting?: number; totalprecinctsreporting?: number } }];
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
      races,
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

export function racesByCategory(races: ResultRace[]) {
  const groups = new Map<string, ResultRace[]>();
  for (const race of races) {
    const list = groups.get(race.category) ?? [];
    list.push(race);
    groups.set(race.category, list);
  }
  const known = categoryOrder.filter((name) => groups.has(name));
  const rest = [...groups.keys()].filter((name) => !categoryOrder.includes(name));
  return [...known, ...rest].map((name) => ({ name, races: groups.get(name) ?? [] }));
}
